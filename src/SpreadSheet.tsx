import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import ReactDOM from 'react-dom'
import './spreadsheet.css'
import { Location, Selection, DataSet, CellData } from './model'
import { iota } from './util'
import { IDataSetView, ICellView, DataSetView } from './view'

//=================================================
// Cell
//=================================================

type CellEvents = {
  onClick: (location: Location) => void
  onDoubleClick: (location: Location) => void
}

type CellProps = {
  selected?: Location
  editing?: Location
  selection: Selection
  location: Location
  cell: ICellView
  dispatch: React.Dispatch<any>
}

export const Cell: React.FC<CellProps> = ({
  location,
  cell,
  selected,
  editing,
  selection,
  dispatch,
}) => {
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      dispatch({ type: 'cursor.set', location })
      e.preventDefault()
    },
    [dispatch, location],
  )
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      dispatch({ type: 'cell.doubleclick', location })
    },
    [dispatch, location],
  )
  const style: any = {}
  if (Location.equals(selected, location)) {
    style.backgroundColor = '#0f8'
  } else if (selection.contains(location)) {
    style.backgroundColor = 'cyan'
  }
  if (Location.equals(editing, location)) {
    return (
      <td className="spx__cell">
        <CellEditor cell={cell} {...{ dispatch, location }} />
      </td>
    )
  } else {
    return (
      <td className="spx__cell" style={style} {...{ onClick, onDoubleClick }}>
        {cell.value}
      </td>
    )
  }
}

//=================================================
// HeadCell
//=================================================

type HeadCellProps = {
  value: string
}

export const HeadCell: React.FC<HeadCellProps> = (props) => {
  return <th className="spx__head-cell">{props.value}</th>
}

//=================================================
// CellEditor
//=================================================

type CellEditorEvents = {
  onKeyDown?: (key: string, shift: boolean, ctrl: boolean) => void
  onChange?: (loc: Location, newValue: string) => void
}

type CellEditorProps = {
  cell: ICellView
  dispatch: React.Dispatch<any>
  location: Location
}

export const CellEditor: React.FC<CellEditorProps> = ({
  cell,
  dispatch,
  location,
}) => {
  const [val, setVal] = useState(cell.value)
  const onChange = useCallback(
    (newValue: string) => {
      setVal(newValue)
    },
    [val],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key == 'Enter') {
        dispatch({ type: 'editor.end', location, newValue: val })
        dispatch({ type: 'cursor.move', dx: 0, dy: 1 })
        e.preventDefault()
      }
    },
    [val, dispatch, location],
  )
  return (
    <div className="spx__cell-editor">
      <input
        type="text"
        autoFocus
        value={val}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}

//=================================================
// Selector
//=================================================

class Selector {
  rows: number
  cols: number

  constructor(rows: number, cols: number) {
    this.rows = rows
    this.cols = cols
  }
  move(loc: Location, x: number, y: number) {
    const newLoc = { row: loc.row + y, col: loc.col + x }
    if (
      newLoc.col < 0 ||
      newLoc.row < 0 ||
      newLoc.col >= this.cols ||
      newLoc.row >= this.rows
    ) {
      return loc
    } else {
      return newLoc
    }
  }

  onKeyDown(
    s: Selection,
    loc: Location,
    start: Location,
    key: string,
    shift: boolean,
    ctrl: boolean,
  ): [Selection, Location, Location] | undefined {
    let newLoc: Location
    switch (key) {
      case 'ArrowUp':
        newLoc = this.move(loc, 0, -1)
        break
      case 'ArrowDown':
        newLoc = this.move(loc, 0, 1)
        break
      case 'ArrowLeft':
        newLoc = this.move(loc, -1, 0)
        break
      case 'ArrowRight':
        newLoc = this.move(loc, 1, 0)
        break
      default:
        return undefined
    }
    if (shift) {
      return [new Selection(newLoc, start), newLoc, start]
    } else {
      return [new Selection(newLoc), newLoc, newLoc]
    }
  }
}

//=================================================
// SpreadSheet
//=================================================
type SpreadSheetProps = {
  header: string[]
  value: number[][]
  onClick: () => void
}

type SpreadSheetState = {
  data: IDataSetView
  selected?: Location
  selectStart?: Location
  selection: Selection
  editing?: Location
  shift: boolean
  tableRef: React.RefObject<HTMLTableElement>
}

function reduceSpreadSheet(
  state: SpreadSheetState,
  action: any,
): SpreadSheetState {
  switch (action.type) {
    case 'cell.select':
      break
    case 'cell.click':
      return {
        ...state,
        selectStart: action.location,
        selected: action.location,
        selection: new Selection(action.location),
        editing: undefined,
      }
    case 'cell.doubleclick':
      return {
        ...state,
        editing: action.location,
      }
    case 'cursor.start_edit':
      return { ...state, editing: state.selected }
    case 'cursor.start_shift':
      return { ...state, shift: true }
    case 'cursor.end_shift':
      return { ...state, shift: false }
    case 'cursor.set': {
      const newLoc = action.location
      let { selectStart } = state
      if (state.shift) {
        state.selection = new Selection(state.selectStart!, newLoc)
      } else {
        state.selection = new Selection(newLoc)
        selectStart = newLoc
      }
      return { ...state, editing: undefined, selected: newLoc, selectStart }
    }
    case 'cursor.move': {
      const newLoc = new Location(
        state.selected!.row + action.dy,
        state.selected!.col + action.dx,
      )
      let { selectStart } = state
      if (state.shift) {
        state.selection = new Selection(state.selectStart!, newLoc)
      } else {
        state.selection = new Selection(newLoc)
        selectStart = newLoc
      }
      return { ...state, editing: undefined, selected: newLoc, selectStart }
    }
    case 'editor.end':
      {
        let { data, editing } = state
        if (editing != null) {
          state.tableRef.current!.focus()
          data.get(editing.row, editing.col).value = action.newValue
          return { ...state, editing: undefined }
        }
      }
      break
    default:
      throw `uknown type ${action.type}`
  }
  return state
}

export const SpreadSheet: React.FC = () => {
  const data = useMemo(() => new DataSetView(new DataSet(30, 8)), [])

  const head = [...Array(data.colNum)].map((_, i) =>
    String.fromCharCode('A'.charCodeAt(0) + i),
  )
  const ref = useRef<HTMLTableElement>(null)
  const [state, dispatch] = useReducer(reduceSpreadSheet, {
    data: data,
    selection: new Selection(0, 0, 0, 0),
    shift: false,
    tableRef: ref,
  })

  function keyToCursor(key: string) {
    switch (key) {
      case 'ArrowUp':
        return [0, -1]
      case 'ArrowDown':
        return [0, 1]
      case 'ArrowLeft':
        return [-1, 0]
      case 'ArrowRight':
        return [1, 0]
      default:
        return undefined
    }
  }

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (state.editing) return
      if (!state.selected) return
      console.log(e.key)
      if (e.key == 'Shift') {
        dispatch({ type: 'cursor.start_shift' })
      } else if (
        !e.ctrlKey &&
        e.key.length == 1 &&
        e.key.charCodeAt(0) > 0x20 &&
        e.key.charCodeAt(0) <= 0x7e
      ) {
        dispatch({ type: 'cursor.start_edit' })
      } else {
        let d = keyToCursor(e.key)
        if (d) {
          dispatch({ type: 'cursor.move', dx: d[0], dy: d[1] })
          e.preventDefault()
        }
      }
    },
    [state],
  )

  const onKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key == 'Shift') {
        dispatch({ type: 'cursor.end_shift' })
      }
    },
    [state],
  )

  return (
    <div className="spx-outer">
      <table
        className="spx"
        ref={ref}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        <thead className="spx__head">
          <tr>
            {head.map((p, idx) => (
              <HeadCell key={`h${idx}`} value={p} />
            ))}
          </tr>
        </thead>
        <tbody className="spx__body">
          {iota(state.data.rowNum, (row) => (
            <tr className="spx__row" key={row}>
              {iota(data.colNum, (col) => (
                <Cell
                  key={`${row}-${col}`}
                  cell={data.get(row, col)}
                  location={{ row, col }}
                  selected={state.selected}
                  editing={state.editing}
                  selection={state.selection}
                  {...{ dispatch }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
