//=================================================
// Location
//=================================================

export class Location {
  static cache = new Map<number, Location>()

  row: number
  col: number

  static from(row: number, col: number): Location {
    const key = row * 1000 + col
    if (Location.cache.has(key)) {
      return Location.cache.get(key)!
    } else {
      const l = new Location(row, col)
      Location.cache.set(key, l)
      return l
    }
  }

  private constructor(row: number, col: number) {
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

//=================================================
// Selection
//=================================================

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

export interface IHeaderView {
  name: string
}

export interface ICell {
  value: string
  //get valueString(): string
  get version(): number
}

export interface ITable {
  get colNum(): number
  get rowNum(): number
  getHeader(col: number): IHeaderView
  get(row: number, col: number): ICell
}
