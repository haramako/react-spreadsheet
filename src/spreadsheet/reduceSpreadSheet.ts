import {
  ICell,
  ITable,
  Position,
  Selection,
  ValueValidatorCollection,
} from './model'
import * as _validators from './validators'

const validators = new ValueValidatorCollection()
validators.add(new _validators.IntegerValidator())
validators.add(new _validators.NumberValidator())
validators.add(new _validators.StringValidator())
validators.add(new _validators.BooleanValidator())

export type SpreadSheetState = {
  data: ITable
  selected?: Position
  selectStart?: Position
  selection: Selection
  editing?: Position
  tableRef: React.RefObject<HTMLDivElement>
  tempPosition?: Position
  tempValue?: any
  dispatch?: (action: any) => void
  filter: string
  onChangeCell?: (cell?: ICell) => void
}

function doSetCellValue(table: ITable, pos: Position, newValue: any) {
  const header = table.getHeader(pos.col)
  const validator = validators.findValidator(header.validatorType)
  let err: string | undefined
  if (validator) {
    ;[err, newValue] = validator.validate(newValue)
  }

  console.log(pos, table.get(pos.row, pos.col))
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

export function setCursor(value: Position, shiftKey: boolean) {
  return { type: 'setCursor' as const, value, shiftKey }
}

export function startEdit(value: Position) {
  return { type: 'startEdit' as const, value }
}

export function setCellValue(value: any, position: Position) {
  return { type: 'setCellValue' as const, value, position }
}

export function setCellTempValue(value: any, position: Position) {
  return { type: 'setCellTempValue' as const, value, position }
}

export type SpreadSheetAction =
  | ReturnType<typeof setCursor>
  | ReturnType<typeof setTable>
  | ReturnType<typeof setFilter>
  | ReturnType<typeof startEdit>
  | ReturnType<typeof setCellValue>
  | ReturnType<typeof setCellTempValue>

export function reduceSpreadSheet(
  state: SpreadSheetState,
  action: SpreadSheetAction,
): SpreadSheetState {
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
    case 'startEdit':
      return { ...state, editing: action.value }
    case 'setCursor': {
      const newLoc = action.value
      if (state.tempPosition !== undefined && state.tempValue !== undefined) {
        doSetCellValue(state.data, state.tempPosition, state.tempValue)
      }

      let { selectStart } = state
      if (action.shiftKey) {
        state.selection = new Selection(state.selectStart!, newLoc)
      } else {
        state.selection = new Selection(newLoc)
        selectStart = newLoc
      }
      return {
        ...state,
        editing: undefined,
        selected: newLoc,
        tempPosition: undefined,
        tempValue: undefined,
        selectStart,
      }
    }
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
    case 'setFilter': {
      return { ...state, filter: action.value }
    }
    /*
    default:
      throw new Error(`uknown type ${action.type}`)
      */
  }
}
