//=================================================
// Location
//=================================================

export class Position {
  static cache = new Map<number, Position>()

  row: number
  col: number

  static from(row: number, col: number): Position {
    const key = row * 1000 + col
    if (Position.cache.has(key)) {
      return Position.cache.get(key)!
    } else {
      const l = new Position(row, col)
      Position.cache.set(key, l)
      return l
    }
  }

  private constructor(row: number, col: number) {
    this.row = row
    this.col = col
  }

  static equals(a?: Position, b?: Position) {
    if (a === b) {
      return true
    } else if (!a || !b) {
      return false
    } else {
      return a.col === b.col && a.row === b.row
    }
  }
}

//=================================================
// Selection
//=================================================

export class Selection {
  top: number
  left: number
  bottom: number
  right: number

  constructor(top: number, left: number, bottom?: number, right?: number)
  constructor(l: Position, start?: Position)

  constructor(...args: any[]) {
    if (typeof args[0] != 'number') {
      if (args.length === 1) {
        const l = args[0] as Position
        this.top = l.row
        this.left = l.col
        this.bottom = l.row + 1
        this.right = l.col + 1
      } else {
        const [l, start] = args as Position[]
        this.top = Math.min(l.row, start.row)
        this.left = Math.min(l.col, start.col)
        this.bottom = Math.max(l.row, start.row) + 1
        this.right = Math.max(l.col, start.col) + 1
      }
    } else {
      const [top, left, bottom, right] = args as (number | undefined)[]
      this.top = top!
      this.left = left!
      this.bottom = bottom ?? top! + 1
      this.right = right ?? left! + 1
    }
  }

  isNone(): boolean {
    return this.width() === 0 || this.height() === 0
  }
  isOne(): boolean {
    return this.width() === 1 && this.height() === 1
  }

  width(): number {
    return this.right - this.left
  }
  height(): number {
    return this.bottom - this.top
  }

  contains(l: Position): boolean {
    return l.row >= this.top && l.row < this.bottom && l.col >= this.left && l.col < this.right
  }
}

//=================================================
// Table models
//=================================================

export type CellType = 'number' | 'string' | 'boolean' | 'object'

export interface IHeader {
  key: string
  name: string
  type: CellType
  validatorType: string
  columnWidth: number
}

export interface IRow {
  guid: number
  data: any
}

export interface ICell {
  value: any
  error: [string, string] | undefined
  get version(): number
  get guid(): number
}

export interface ITable {
  get colNum(): number
  get rowNum(): number
  getHeader(col: number): IHeader
  getRow(row: number): IRow
  get(row: number, col: number): ICell
}

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
  columnWidth: number

  constructor(template: HeaderTemplate)
  constructor(key: string, type: CellType)
  constructor(...args: any) {
    if (args.length === 1) {
      const t: HeaderTemplate = args[0]
      this.key = t.key
      this.name = t.name ?? t.key
      this.type = t.type ?? 'string'
      this.validatorType = t.validatorType ?? this.type
      this.unique = t.unique ?? false
      this.columnWidth = t.columnWidth ?? 80
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
      this.columnWidth = 80
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
  columnWidth?: number
}

//=================================================
// Validator
//=================================================

export interface IValueValidator {
  isMatch(v: string): boolean
  validate(v: any): [string | undefined, any]
}

export class ValueValidatorCollection {
  validators: IValueValidator[] = []

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
