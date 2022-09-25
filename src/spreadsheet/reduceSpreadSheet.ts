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

function setCellValue(table: ITable, pos: Position, newValue: any) {
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

export function reduceSpreadSheet(
  state: SpreadSheetState,
  action: any,
): SpreadSheetState {
  console.log(action)
  switch (action.type) {
    case 'set_table':
      const table = action.table
      return {
        ...state,
        data: table,
        selection: new Selection(0, 0, 0, 0),
        editing: undefined,
        selected: undefined,
        selectStart: undefined,
      }
    case 'set_onChangeCell':
      return { ...state, onChangeCell: action.onChangeCell }
    case 'cell.doubleclick':
      return { ...state, editing: action.location }
    case 'cursor.start_edit':
      return { ...state, editing: state.selected }
    case 'cursor.set': {
      const newLoc = action.location
      if (state.tempPosition !== undefined && state.tempValue !== undefined) {
        setCellValue(state.data, state.tempPosition, state.tempValue)
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
    case 'cursor.move': {
      if (state.tempPosition !== undefined && state.tempValue !== undefined) {
        setCellValue(state.data, state.tempPosition, state.tempValue)
      }
      const newLoc = Position.from(
        state.selected!.row + action.dy,
        state.selected!.col + action.dx,
      )
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
        selectStart,
        tempPosition: undefined,
        tempValue: undefined,
      }
    }
    case 'cell.change_value': {
      let { data } = state
      let location: Position = action.location
      const header = data.getHeader(location.col)
      const validator = validators.findValidator(header.validatorType)
      let err: string | undefined
      let newValue: any
      if (validator) {
        ;[err, newValue] = validator.validate(action.newValue)
      } else {
        newValue = action.newValue
      }

      const cell = data.get(location.row, location.col)
      if (err) {
        cell.error = [newValue, err]
      } else {
        cell.value = newValue
      }
      return { ...state }
    }
    case 'editor.setValue': {
      let { data } = state
      const editing = action.location as Position
      if (editing != null) {
        setCellValue(data, editing, action.newValue)
        return { ...state, tempPosition: undefined, tempValue: undefined }
      } else {
        return state
      }
    }
    case 'editor.end':
      if (state.tempPosition !== undefined && state.tempValue !== undefined) {
        setCellValue(state.data, state.tempPosition, state.tempValue)
      }
      state.tableRef.current!.focus()
      return {
        ...state,
        editing: undefined,
        tempPosition: undefined,
        tempValue: undefined,
      }
    case 'editor.setTempValue': {
      const tempPosition = action.location
      const tempValue = action.newValue
      return { ...state, tempPosition, tempValue }
    }
    case 'filter.set': {
      let { value } = action
      return { ...state, filter: value }
    }
    default:
      throw new Error(`uknown type ${action.type}`)
  }
}
