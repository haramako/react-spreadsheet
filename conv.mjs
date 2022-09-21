import { tsv2json } from 'tsv-json'
import { writeFileSync } from 'fs'
import { execFileSync } from 'child_process'
import { chdir, cwd } from 'process'

const ElementTypes = {
  number: 'number',
  bool: 'boolean',
  string: 'string'
}

export function loadTsv(src) {
  const rows = tsv2json(src)

  let columns = []
  let keys = []
  let types = []
  const data = []
  for (let row of rows) {
    if (row[0].startsWith('$KEY')) {
      keys = row
      keys[0] = keys[0].split(' ', 2)[1]
    } else if (row[0].startsWith('$TYPE')) {
      types = row
      types[0] = types[0].split(' ', 2)[1]
      columns = keys.map((key, i) => {
        let type = types[i]
        type = ElementTypes[type] ?? 'object'
        return { key, type }
      })
    } else if (row[0].startsWith('$') || row[0].startsWith('#')) {
      // DO NOTHING
    } else {
      var obj = {}
      row.map((e, i) => {
        switch (types[i]) {
          case 'int':
            obj[keys[i]] = parseInt(e)
            break
          case 'bool':
            obj[keys[i]] = e === '〇' || e === 'true'
            break
          default:
            obj[keys[i]] = e.replace('\\n', '\n')
            break
        }
      })
      data.push(obj)
    }
  }

  return [columns, data]
}

console.log(process.argv)

const baseDir = 'C:/work/dfz_master'
const xlsxFiles = {
  'Basic.xlsx': ['StatusInfo', 'ItemTypeInfo', 'Trap.ItemTemplate', 'SpecialPanel', 'Skill', 'ThinkingType'],
  'Character.xlsx': ['CharacterTemplate']
}

const oldDir = cwd()
chdir(baseDir)

const data = {}
for (let f in xlsxFiles) {
  for (let sheet of xlsxFiles[f]) {
    const result = execFileSync('xlsconv.exe', [f, sheet])
    const [columns, items] = loadTsv(result.toString())
    data[sheet] = { columns, items }
  }
}

chdir(oldDir)

const json = JSON.stringify(data, undefined, "\t")
writeFileSync('public/data.json', json)


