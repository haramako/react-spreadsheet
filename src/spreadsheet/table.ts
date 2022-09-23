import { CellType, ICell, IHeader, IRow, ITable } from './model'
import { iota } from './util'

//=================================================
// HeaderData
//=================================================
export class HeaderData implements IHeader {
  key: string
  name: string
  type: CellType
  validatorType: string
  unique: boolean
  isData: boolean = true
  constructor(template: HeaderTemplate)
  constructor(key: string, type: CellType)
  constructor(...args: any) {
    if (args.length === 1) {
      const t: HeaderTemplate = args[0]
      this.key = t.key
      this.name = t.name ?? t.key
      this.type = t.type ?? 'string'
      this.validatorType = t.validatorType ?? 'string'
      this.unique = t.unique ?? false
    } else {
      const key: string = args[0]
      const type: CellType = args[1]
      this.key = key
      this.name = key
      this.type = type
      this.validatorType = type
      if (type === 'number') {
        this.validatorType = 'int'
      }
      this.unique = false
    }
  }

  static from(src: HeaderData | HeaderTemplate) {
    if (src.hasOwnProperty('isData')) {
      return src as HeaderData
    } else {
      return new HeaderData(src)
    }
  }
}

export type HeaderTemplate = {
  key: string
  name?: string
  type?: CellType
  validatorType?: string
  unique?: boolean
}
