import { iota } from './util'

//=================================================
// Location
//=================================================

export class Location {
  row: number
  col: number

  constructor(row: number, col: number) {
    this.row = row
    this.col = col
  }

  static equals(a?: Location, b?: Location) {
    if (a === b) {
      return true
    } else if (!a || !b) {
      return false
    } else {
      return a.col === b.col && a.row === b.row
    }
  }
}

export class Selection {
  top: number
  left: number
  bottom: number
  right: number

  constructor(top: number, left: number, bottom?: number, right?: number)
  constructor(l: Location, start?: Location)

  constructor(...args: any[]) {
    if (typeof args[0] != 'number') {
      if (args.length === 1) {
        const l = args[0] as Location
        this.top = l.row
        this.left = l.col
        this.bottom = l.row + 1
        this.right = l.col + 1
      } else {
        const [l, start] = args as Location[]
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

  contains(l: Location): boolean {
    return (
      l.row >= this.top &&
      l.row < this.bottom &&
      l.col >= this.left &&
      l.col < this.right
    )
  }
}

//=================================================
// CellData
//=================================================
export class CellData {
  #value: string
  #version: number
  callback: () => void

  constructor(value: string) {
    this.#value = value
    this.#version = 0
    this.callback = () => {}
  }

  get value() {
    return this.#value
  }

  set value(v: string) {
    this.#value = v
    this.#version++
    this.callback()
  }

  get version() {
    return this.#version
  }

  onChange(callback: () => void) {
    this.callback = callback
  }
}

export class DataSet {
  colNum: number
  rowNum: number
  data: CellData[][]
  constructor(rowNum: number, colNum: number) {
    this.rowNum = rowNum
    this.colNum = colNum
    this.data = iota(colNum, (i) => iota(rowNum, (j) => new CellData('' + j)))
  }

  get(row: number, col: number) {
    return this.data[row][col]
  }
}
