import { SpreadSheetState } from './contexts'
import { ITable, Position, Selection, ValueValidatorCollection } from './model'
import * as _validators from './validators'

const validators = new ValueValidatorCollection()
validators.add(new _validators.IntegerValidator())
validators.add(new _validators.NumberValidator())
validators.add(new _validators.StringValidator())
validators.add(new _validators.BooleanValidator())

function doSetCellValue(table: ITable, pos: Position, newValue: any) {
  const header = table.getHeader(pos.col)
  console.log(header)
  const validator = validators.findValidator(header.validatorType)
  let err: string | undefined
  if (validator) {
    ;[err, newValue] = validator.validate(newValue)
  }

  if (err) {
    table.get(pos.row, pos.col).error = [newValue, err]
  } else {
    table.get(pos.row, pos.col).value = newValue
  }
}

export function setTable(value: ITable) {
  return { type: 'setTable' as const, value }
}

export function setFilter(value: string) {
  return { type: 'setFilter' as const, value }
}

export function setCursor(position: Position, shiftKey: boolean) {
  return { type: 'setCursor' as const, position, shiftKey }
}

export function moveCursor(dRow: number, dCol: number, shiftKey: boolean) {
  return { type: 'moveCursor' as const, dRow, dCol, shiftKey }
}

export function startEdit(position: Position) {
  return { type: 'startEdit' as const, position }
}

export function setCellValue(value: any, position: Position) {
  return { type: 'setCellValue' as const, value, position }
}

export function setCellTempValue(value: any, position: Position) {
  return { type: 'setCellTempValue' as const, value, position }
}

export function clearCellValue(position: Position) {
  return { type: 'clearCellValue' as const, position }
}

export function cancelCellEdit() {
  return { type: 'cancelCellEdit' as const }
}

export function resizeColumn(column: number) {
  return { type: 'resizeColumn' as const, column }
}

export type SpreadSheetAction =
  | ReturnType<typeof setCursor>
  | ReturnType<typeof moveCursor>
  | ReturnType<typeof setTable>
  | ReturnType<typeof setFilter>
  | ReturnType<typeof startEdit>
  | ReturnType<typeof setCellValue>
  | ReturnType<typeof setCellTempValue>
  | ReturnType<typeof clearCellValue>
  | ReturnType<typeof cancelCellEdit>
  | ReturnType<typeof resizeColumn>

export function reduceSpreadSheet(state: SpreadSheetState, action: SpreadSheetAction): SpreadSheetState {
  console.log(action)
  switch (action.type) {
    case 'setTable':
      return {
        ...state,
        data: action.value,
        selection: new Selection(0, 0, 0, 0),
        editing: undefined,
        selected: undefined,
        selectStart: undefined,
      }
    case 'setFilter': {
      return { ...state, filter: action.value }
    }
    case 'startEdit':
      return { ...state, editing: action.position }
    case 'moveCursor': {
      if (!state.selected) {
        return state
      }
      const table = state.data
      const position = Position.from(state.selected.row + action.dRow, state.selected.col + action.dCol)
      if (position.row >= 0 && position.row < table.rowNum && position.col >= 0 && position.col < table.colNum) {
        return doSetCursor(state, position, action.shiftKey)
      } else {
        return state
      }
    }
    case 'setCursor':
      return doSetCursor(state, action.position, action.shiftKey)
    case 'setCellValue': {
      let { data } = state
      const editing = action.position
      if (editing != null) {
        doSetCellValue(data, editing, action.value)
        return { ...state, tempPosition: undefined, tempValue: undefined }
      } else {
        return state
      }
    }
    case 'setCellTempValue': {
      return {
        ...state,
        tempPosition: action.position,
        tempValue: action.value,
      }
    }
    case 'clearCellValue': {
      state.data.get(action.position.row, action.position.col).value = ''
      return {
        ...state,
      }
    }
    case 'cancelCellEdit': {
      state.tableRef.current!.focus()
      return {
        ...state,
        editing: undefined,
        tempPosition: undefined,
        tempValue: undefined,
      }
    }
    case 'resizeColumn': {
      state.gridRef.current?.resetAfterColumnIndex(action.column, true)
      state.colHeadRef.current?.resetAfterIndex(action.column, true)
      return { ...state }
    }
  }
}

function doSetCursor(state: SpreadSheetState, position: Position, shiftKey: boolean) {
  if (state.tempPosition !== undefined && state.tempValue !== undefined) {
    doSetCellValue(state.data, state.tempPosition, state.tempValue)
  }

  let { selectStart } = state
  if (shiftKey) {
    state.selection = new Selection(state.selectStart!, position)
  } else {
    state.selection = new Selection(position)
    selectStart = position
  }

  state.tableRef.current!.focus()

  return {
    ...state,
    editing: undefined,
    selected: position,
    tempPosition: undefined,
    tempValue: undefined,
    selectStart,
  }
}
