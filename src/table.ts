import { ICell, ITable } from './model'
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
    if (this.#error !== undefined || this.#value != v) {
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
// CellType
//=================================================
type CellType = 'number' | 'string' | 'boolean' | 'object'

//=================================================
// HeaderData
//=================================================
export class HeaderData {
  name: string
  type: CellType
  validatorType: string
  unique: boolean
  constructor(name: string, type: CellType) {
    this.name = name
    this.type = type
    this.validatorType = type
    if (type == 'number') {
      this.validatorType = 'int'
    }
    this.unique = false
  }
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
    this.headers = iota(
      colNum,
      (i) =>
        new HeaderData(
          String.fromCharCode('A'.charCodeAt(0) + i),
          i % 2 == 0 ? 'string' : 'number',
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

export interface IValueValidator {
  isMatch(v: string): boolean
  validate(v: any): [string | undefined, any]
}

export class ValueValidatorCollection {
  validators: IValueValidator[] = []

  constructor() {}

  add(validator: IValueValidator) {
    this.validators.push(validator)
  }

  findValidator(type: string): IValueValidator | undefined {
    for (let validator of this.validators) {
      if (validator.isMatch(type)) {
        return validator
      }
    }
    return undefined
  }

  validate(type: string, v: any): [string | undefined, any] {
    const validator = this.findValidator(type)
    if (validator) {
      return validator.validate(v)
    } else {
      return ['validator not match', v]
    }
  }
}
