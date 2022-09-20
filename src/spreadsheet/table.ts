import { CellType, ICell, ITable } from './model'
import { iota } from './util'

//=================================================
// CellData
//=================================================
export class CellData implements ICell {
  #value: string
  #version: number = 0
  #error?: [string, string]

  constructor(value: string) {
    this.#value = value
  }

  get value() {
    return this.#value
  }

  set value(v: string) {
    if (this.#error !== undefined || this.#value !== v) {
      this.#value = v
      this.#error = undefined
      this.#version++
    }
  }

  get hasError(): boolean {
    return !!this.#error
  }

  get error(): [string, string] | undefined {
    return this.#error
  }

  set error(v: [string, string] | undefined) {
    if (this.#error !== v) {
      this.#error = v
      this.#version++
    }
  }

  get version() {
    return this.#version
  }
}

//=================================================
// HeaderData
//=================================================
export class HeaderData {
  name: string
  type: CellType
  validatorType: string
  unique: boolean
  isData: boolean = true
  constructor(template: HeaderTemplate)
  constructor(name: string, type: CellType)
  constructor(...args: any) {
    if (args.length === 1) {
      const t: HeaderTemplate = args[0]
      this.name = t.name
      this.type = t.type ?? 'string'
      this.validatorType = t.validatorType ?? 'string'
      this.unique = t.unique ?? false
    } else {
      const name: string = args[0]
      const type: CellType = args[1]
      this.name = name
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
  name: string
  type?: CellType
  validatorType?: string
  unique?: boolean
}

//=================================================
// Table
//=================================================
export class Table implements ITable {
  colNum: number
  rowNum: number
  data: CellData[][]
  headers: HeaderData[]

  constructor(rowNum: number, colNum: number) {
    this.rowNum = rowNum
    this.colNum = colNum
    this.data = iota(rowNum, (i) => iota(colNum, (j) => new CellData('' + j)))
    const types = ['string', 'number', 'boolean']
    this.headers = iota(
      colNum,
      (i) =>
        new HeaderData(
          String.fromCharCode('A'.charCodeAt(0) + i),
          types[i % 3] as CellType,
        ),
    )
  }

  getHeader(col: number) {
    return this.headers[col]
  }

  get(row: number, col: number) {
    return this.data[row][col]
  }
}

//=================================================
// JSONCellData
//=================================================
export class JSONCellData implements ICell {
  #data: any
  #key: string
  #version: number = 0
  #error?: [string, string]

  constructor(data: object, key: string) {
    this.#data = data
    this.#key = key
  }

  get value() {
    return this.#data[this.#key] as string
  }

  set value(v: string) {
    if (this.#error !== undefined || this.value !== v) {
      this.#data[this.#key] = v
      this.#error = undefined
      this.#version++
    }
  }

  get hasError(): boolean {
    return !!this.#error
  }

  get error(): [string, string] | undefined {
    return this.#error
  }

  set error(v: [string, string] | undefined) {
    if (this.#error !== v) {
      this.#error = v
      this.#version++
    }
  }

  get version() {
    return this.#version
  }
}

//=================================================
// JSONTable
//=================================================
export class JSONTable implements ITable {
  colNum: number
  rowNum: number
  data: JSONCellData[][]
  keys: string[]
  headers: HeaderData[]

  constructor(data: any[]) {
    this.data = []
    this.keys = []
    for (let key in data[0]) {
      if (data[0].hasOwnProperty(key)) {
        this.keys.push(key)
      }
    }

    this.colNum = this.keys.length
    this.rowNum = data.length

    this.data = data.map((row) =>
      this.keys.map((key) => new JSONCellData(row, key)),
    )
    this.headers = this.keys.map((key) => {
      return new HeaderData(key, typeof data[0][key] as CellType)
    })
  }

  getHeader(col: number) {
    return this.headers[col]
  }

  get(row: number, col: number) {
    return this.data[row][col]
  }
}
