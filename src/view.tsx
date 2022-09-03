import { CellData, DataSet } from './model'

export class CellView implements ICellView {
  cell: CellData
  constructor(cell: CellData) {
    this.cell = cell
  }
  get value(): string {
    return this.cell.value
  }
  set value(v: string) {
    this.cell.value = v
  }
  get version(): number {
    return this.cell.version
  }
}

export class DataSetView implements IDataSetView {
  data: DataSet
  constructor(data: DataSet) {
    this.data = data
  }
  get colNum() {
    return this.data.colNum
  }
  get rowNum() {
    return this.data.rowNum
  }

  get(row: number, col: number): CellView {
    return new CellView(this.data.get(row, col))
  }
}

export interface ICellView {
  value: string
  //get valueString(): string
  get version(): number
}

export interface IDataSetView {
  get colNum(): number
  get rowNum(): number
  get(row: number, col: number): CellView
}
