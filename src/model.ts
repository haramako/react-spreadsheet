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
    return (
      l.row >= this.top &&
      l.row < this.bottom &&
      l.col >= this.left &&
      l.col < this.right
    )
  }
}

//=================================================
// Table models
//=================================================

export type CellType = 'number' | 'string' | 'boolean' | 'object'

export interface IHeader {
  name: string
  type: CellType
  validatorType: string
}

export interface ICell {
  value: string
  error: [string, string] | undefined
  get version(): number
}

export interface ITable {
  get colNum(): number
  get rowNum(): number
  getHeader(col: number): IHeader
  get(row: number, col: number): ICell
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
