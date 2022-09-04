export interface IHeaderView {
  name: string
}

export interface ICellView {
  value: string
  //get valueString(): string
  get version(): number
}

export interface IDataSetView {
  get colNum(): number
  get rowNum(): number
  getHeader(col: number): IHeaderView
  get(row: number, col: number): ICellView
}
