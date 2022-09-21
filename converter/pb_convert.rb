# coding: utf-8
# frozen_string_literal: true

require "excel"
require "stringio"
require "active_support/inflector"
require "zlib"
Dir[File.expand_path("../model/", __FILE__) << "/*.rb"].each { |file| require file }

module PbConvert
  module_function

  def clear_excel_cache
    @excel_cache = {}
  end

  def excel_cache(path)
    @excel_cache = {} unless @excel_cache
    unless @excel_cache[path]
      logger.debug "エクセルファイル読み込み #{path}"
      @excel_cache[path] = Spreadsheet.open(StringIO.new(IO.binread(path)))
    end
    @excel_cache[path]
  end

  def conv_sheet(src, sheet)
    types, data = Excel.read_from_file(src, excel_cache(src), sheet)

    # used が存在して、falseならそのカラムを削除する
    data = data.select do |row|
      if !row[:used].nil?
        used = row[:used]
        row.delete(:used)
        used
      else
        true
      end
    end

    [types, data]
  end

  def conv_message(_class, data)
    m = _class.new

    conv_message_hook(_class, data)

    data.each do |k, v|
      begin
        k, v = conv_field_name(_class, k, v)
        k = k.to_s

        # 数字のインデックスが来た場合は、名前に変換する
        if k =~ /^\d+$/
          desc = field_of_index(_class, k.to_i + 1)
          unless desc
            logger.warn "#{_class.name} に #{k} が存在しません"
            break
          end
          k = desc.name
        end

        desc = _class.descriptor.lookup(k)
        if desc
          conv_field(m, desc, k, v)
        else
          logger.warn "#{_class.name} に #{k} が存在しません"
        end
      rescue
        logger.error "コンバートできません #{_class}.#{k} = #{v}"
        logger.error data
        logger.error $ERROR_INFO.to_s
        # raise
      end
    end
    m
  end

  def conv_field(m, desc, k, v)
    if desc.map_entry?
      f = m.__send__(k)
      v.each do |k2, v2|
        k2 = conv_type(desc.subtype.lookup("key"), k2)
        v2 = conv_type(desc.subtype.lookup("value"), v2)
        f[k2] = v2
      end
    elsif desc.label == :repeated
      f = m.__send__(k)
      v.each { |v2| f << conv_type(desc, v2) }
    else
      begin
        v2 = conv_type(desc, v)
        desc.set m, v2
      rescue RangeError
        logger.error "#{v} は #{desc.name} の値として不正です。"
        raise
      end
    end
  end

  def conv_type(desc, v)
    case desc.type
    when :enum
      if v.is_a? Array
        v.reduce(0) { |m, x| (m | desc.subtype.lookup_name(x.camelize.to_sym)) }
      else
        v.camelize.to_sym
      end
    when :bool
      if v.is_a? String
        !(v =~ /true/i).nil?
      else
        v
      end
    when :string
      v = v.to_s if v.is_a? Symbol
      v
    when :message
      conv_message(desc.subtype.msgclass, v)
    else
      v
    end
  end

  def conv_field_name(_class, k, v)
    case k
    when :element
      v = "no_element" if v == ""
    end
    [k, v]
  end

  def conv_message_hook(_class, data)
    case _class.name
    when "Master::CharacterTemplate"
      # skill_on_attack を作成
      if data[:skill_on_attack]
        skill_on_attack = { codes: data[:skill_on_attack] }
      else
        skill_on_attack = nil
      end

      # skill_name + skill_code で skills を作成
      data[:skill_option] = data[:skill_code].map { nil } unless data[:skill_option]
      raise "skill_nameとskill_codesとskill_optionの数があっていません" if data[:skill_name].size != data[:skill_code].size && data[:skill_name].size != data[:skill_option].size
      skills = data[:skill_name].zip(data[:skill_code], data[:skill_option]).map do |name, code, option|
        if name != ""
          { name: name, codes: code }.merge(option || {})
        else
          nil
        end
      end
      data[:skills] = [skill_on_attack] + skills.reject(&:nil?) # TODO: nilを消すかどうか悩みどころ

      # soul_name + soul_cond + soul_code で souls を作成
      return data unless data[:soul_name] and data[:soul_cond] and data[:soul_code] # TODO: そのうち消す、データがないからしょうがなくいれてる
      if data[:soul_name].size != data[:soul_cond].size || data[:soul_name].size != data[:soul_code].size
        raise "soul_nameとsoul_condとsoul_codeの数があっていません"
      end
      souls = data[:soul_name].zip(data[:soul_cond], data[:soul_code]).map do |name, cond, code|
        if name != ""
          cond.merge(name: name, codes: code)
        else
          nil
        end
      end
      data[:souls] = souls.reject(&:nil?) # TODO: nilを消すかどうか悩みどころ

      data.delete(:skill_name)
      data.delete(:skill_code)
      data.delete(:skill_option)
      data.delete(:skill_on_attack)
      data.delete(:soul_name)
      data.delete(:soul_code)
      data.delete(:soul_cond)
    when "Master::ItemTemplate", "Master::RelicTemplate"
      # soul_name + soul_cond + soul_code で souls を作成
      return data unless data[:soul_cond] and data[:soul_code] # TODO: そのうち消す、データがないからしょうがなくいれてる
      if data[:soul_cond].size != data[:soul_code].size
        raise "soul_condとsoul_codeの数があっていません"
      end
      souls = data[:soul_cond].zip(data[:soul_code]).map do |cond, code|
        if !cond.nil?
          cond.merge(codes: code)
        else
          nil
        end
      end
      data[:souls] = souls.reject(&:nil?) # TODO: nilを消すかどうか悩みどころ

      data.delete(:soul_code)
      data.delete(:soul_cond)
    when "Master::Tenant"
      [[:eid, :prob], [:eid2, :prob2], [:eid3, :prob3]].each do |eid_key, prob_key|
        next unless data[eid_key] and data[prob_key] # TODO: そのうち消す、データがないからしょうがなくいれてる
        raise "eidとprobの数があっていません" if data[eid_key].size != data[prob_key].size
        eid_and_probs = data[eid_key].zip(data[prob_key]).map do |eid, prob|
          if eid == 0
            nil
          else
            [eid, prob]
          end
        end
        eid_and_probs.reject!(&:nil?)
        data[eid_key] = eid_and_probs.map { |x| x[0] }
        data[prob_key] = eid_and_probs.map { |x| x[1] }
      end
    when "Master::ItemSet"
      item_ids = []
      item_probs = []
      delete_ids = []
      data.each do |k, v|
        next unless k.to_s =~ /^\d+(\.0)?$/ # なぜか、".0"が加わってしまうので、
        if v > 0
          item_ids << k.to_s.to_i
          item_probs << v
        end
        delete_ids << k
      end
      delete_ids.each do |id|
        data.delete(id)
      end
      data[:item_ids] = item_ids
      data[:item_probs] = item_probs
    when "Master::MetaMapDesc"
      group_ids = data[:group_ids]
      group_probs = data[:group_probs]
      raise "eidとprobの数があっていません" if group_ids.size != group_probs.size
      entries = group_ids.zip(group_probs).map do |id, prob|
        if id == ""
          nil
        else
          { meta_map_set_id: id, prob: prob }
        end
      end
      entries.reject!(&:nil?)
      data[:group_entries] = entries
      data.delete(:group_ids)
      data.delete(:group_probs)
    end
    data
  end
end
