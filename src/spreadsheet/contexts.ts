import { createContext, useContext } from 'react'
import { VariableSizeGrid, VariableSizeList } from 'react-window'
import { ICell, ITable, Position, Selection } from './model'
import { SpreadSheetAction } from './reduceSpreadSheet'

export type SpreadSheetState = {
  data: ITable
  selected?: Position
  selectStart?: Position
  selection: Selection
  editing?: Position
  tableRef: React.RefObject<HTMLDivElement>
  gridRef: React.RefObject<VariableSizeGrid>
  colHeadRef: React.RefObject<VariableSizeList>
  rowHeadRef: React.RefObject<VariableSizeList>
  tempPosition?: Position
  tempValue?: any
  dispatch?: (action: any) => void
  filter: string
  onChangeCell?: (cell?: ICell) => void
}

export const TableContext = createContext<ITable>(null as unknown as ITable)

export function useTable(): ITable {
  return useContext(TableContext)
}

export const TableDispatcherContext = createContext<React.Dispatch<SpreadSheetAction>>(() => {})

export function useTableDispatcher() {
  return useContext(TableDispatcherContext)
}
