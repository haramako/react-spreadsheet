import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useLayoutEffect,
  createContext,
  useContext,
} from 'react'
import ReactDOM from 'react-dom'
import './spreadsheet.css'
import {
  Location,
  Selection,
  ITable,
  ICell,
  IHeader,
  ValueValidatorCollection,
} from './model'
import {
  BooleanValidator,
  IntegerValidator,
  NumberValidator,
  StringValidator,
} from './validators'
import { Visualizers } from './visualizers'
import {
  VariableSizeGrid,
  VariableSizeList,
  GridOnScrollProps,
  GridChildComponentProps,
  ListChildComponentProps,
} from 'react-window'
import shallowEquals from 'shallow-equals'

//=================================================
// Cell
//=================================================

type CellProps = {
  location: Location
  header: IHeader
  cell: ICell
  selected: boolean
  editing: boolean
  version: number
  style: any
}

function cellEaual(prev: Readonly<CellProps>, next: Readonly<CellProps>) {
  let { style: prevStyle, ...prevRest } = prev
  let { style: nextStyle, ...nextRest } = next
  return (
    shallowEquals(prevStyle, nextStyle) && shallowEquals(prevRest, nextRest)
  )
}

export const Cell: React.FC<CellProps> = React.memo(
  ({ location, cell, selected, editing, version, header, style }) => {
    const dispatch = useTableDispatcher()
    const onClick = useCallback(
      (e: React.MouseEvent) => {
        dispatch({ type: 'cursor.set', location, shiftKey: e.shiftKey })
      },
      [dispatch, location],
    )
    const onDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        console.log('double')
        dispatch({ type: 'cell.doubleclick', location })
      },
      [dispatch, location],
    )
    //console.log(location)
    if (selected) {
      style = { ...style, backgroundColor: 'cyan' }
    }

    const Visualizer = Visualizers[header.type]

    let value = cell.value
    let err = cell.error
    let errMessage: string | undefined
    if (err) {
      value = err[0]
      errMessage = '(' + err[1] + ')'
      style = { ...style, backgroundColor: '#f88' }
    }

    if (editing) {
      return (
        <div className="spx__cell" style={style}>
          <CellEditor cell={cell} {...{ value, dispatch, location }} />
        </div>
      )
    } else {
      return (
        <div
          className="spx__cell"
          style={style}
          {...{ onClick, onDoubleClick }}
        >
          <Visualizer {...{ location, value, dispatch }} />
          {errMessage}
        </div>
      )
    }
  },
  cellEaual,
)

Cell.displayName = 'Cell'

//=================================================
// HeadCell
//=================================================z

type HeadCellProps = {
  value: IHeader
  style: any
}

export const HeadCell: React.FC<HeadCellProps> = React.memo(
  ({ value, style }) => {
    return (
      <div className="spx__head-cell" style={style}>
        {value.name}
      </div>
    )
  },
)

//=================================================
// RowHeadCell
//=================================================

type RowHeadCellProps = {
  value: number
  style: any
}

export const RowHeadCell: React.FC<RowHeadCellProps> = React.memo(
  ({ value, style }) => {
    return (
      <div className="spx__row-head-cell" style={style}>
        {value}
      </div>
    )
  },
)

//=================================================
// CellEditor
//=================================================

type CellEditorProps = {
  cell: ICell
  value: string
  dispatch: React.Dispatch<any>
  location: Location
}

export const CellEditor: React.FC<CellEditorProps> = ({
  cell,
  value,
  dispatch,
  location,
}) => {
  const [val, setVal] = useState(value)
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
      return undefined
    } else {
      return newLoc
    }
  }
}

//=================================================
// reduceSpreadSheet
//=================================================
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
      console.log('double')
      return {
        ...state,
        editing: action.location,
      }
    case 'cursor.start_edit':
      return { ...state, editing: state.selected }
    case 'cursor.set': {
      const newLoc = action.location
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
      }
    }
    case 'cursor.move': {
      const newLoc = Location.from(
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
      }
    }
    case 'cell.change_value': {
      let { data } = state
      let location: Location = action.location
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
      const oldVersion = cell.version
      if (err) {
        cell.error = [newValue, err]
      } else {
        cell.value = newValue
      }
      return state
    }
    case 'editor.end':
      {
        let { data, editing } = state
        if (editing != null) {
          // Validate new value.
          const header = data.getHeader(editing.col)
          const validator = validators.findValidator(header.validatorType)
          let err: string | undefined
          let newValue: any
          if (validator) {
            ;[err, newValue] = validator.validate(action.newValue)
          } else {
            newValue = action.newValue
          }

          if (err) {
            state.tableRef.current!.focus()
            data.get(editing.row, editing.col).error = [newValue, err]
            return { ...state, editing: undefined }
          } else {
            state.tableRef.current!.focus()
            data.get(editing.row, editing.col).value = newValue
            return { ...state, editing: undefined }
          }
        }
      }
      break
    default:
      throw `uknown type ${action.type}`
  }
  return state
}

//=================================================
// SpreadSheet
//=================================================
export const TableContext = createContext<ITable>(null as unknown as ITable)

export function useTable(): ITable {
  return useContext(TableContext)
}

type TableDispatcher = (action: any) => void
export const TableDispatcherContext = createContext<TableDispatcher>(() => {})

export function useTableDispatcher(): TableDispatcher {
  return useContext(TableDispatcherContext)
}

type SpreadSheetState = {
  data: ITable
  selected?: Location
  selectStart?: Location
  selection: Selection
  editing?: Location
  tableRef: React.RefObject<HTMLDivElement>
  dispatch?: (action: any) => void
}

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
    case 'Enter':
      return [0, 1]
    case 'Tab':
      return [1, 0]
    default:
      return undefined
  }
}

function isNormalKey(key: string) {
  return (
    key.length == 1 && key.charCodeAt(0) > 0x20 && key.charCodeAt(0) <= 0x7e
  )
}

const validators = new ValueValidatorCollection()
validators.add(new IntegerValidator())
validators.add(new NumberValidator())
validators.add(new StringValidator())
validators.add(new BooleanValidator())

type SpreadSheetProps = {
  table: ITable
}

type MakeCellData = {
  table: ITable
  selection: Selection
  editing?: Location
}

function MakeCell({
  columnIndex,
  rowIndex,
  style,
  data,
}: GridChildComponentProps<SpreadSheetState>) {
  const row = rowIndex
  const col = columnIndex
  const location = Location.from(row, col)
  let cell = data.data.get(row, col)
  let header = data.data.getHeader(col)
  let editing = Location.equals(data.editing, location)
  let selected = data.selection.contains(location)
  return (
    <Cell
      {...{
        style,
        cell,
        header,
        selected,
        editing,
        location,
        version: cell.version,
      }}
    />
  )
}

function makeColumnHead({
  index,
  style,
  data,
}: ListChildComponentProps<SpreadSheetState>) {
  return <HeadCell value={data.data.getHeader(index)} style={style} />
}

function makeRowHead({
  index,
  style,
  data,
}: ListChildComponentProps<SpreadSheetState>) {
  return <RowHeadCell value={index} style={style} />
}

export const SpreadSheet: React.FC<SpreadSheetProps> = ({ table }) => {
  const ref = useRef<HTMLTableElement>(null)
  const [state, dispatch] = useReducer(reduceSpreadSheet, {
    data: table,
    selection: new Selection(0, 0, 0, 0),
    tableRef: ref,
  })

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (state.editing) return
      if (!state.selected) return
      if (!e.ctrlKey && isNormalKey(e.key)) {
        dispatch({ type: 'cursor.start_edit' })
      } else if (e.key == 'F2') {
        dispatch({ type: 'cursor.start_edit' })
      } else {
        let d = keyToCursor(e.key)
        if (d) {
          dispatch({
            type: 'cursor.move',
            dx: d[0],
            dy: d[1],
            shiftKey: e.shiftKey,
          })
          e.preventDefault()
        }
      }
    },
    [state, dispatch],
  )

  const [scrollPos, setScrollPos] = useState([0, 0])

  const onScroll = useCallback((props: GridOnScrollProps) => {
    setScrollPos([props.scrollLeft, props.scrollTop])
  }, [])

  const colHeadRef = useRef<VariableSizeList>(null)
  const rowHeadRef = useRef<VariableSizeList>(null)

  useLayoutEffect(() => {
    colHeadRef.current?.scrollTo(scrollPos[0])
    rowHeadRef.current?.scrollTo(scrollPos[1])
  }, [scrollPos])

  const columnWidth = useCallback((i: number) => {
    return i % 2 == 0 ? 80 : 100
  }, [])

  const columnHeight = useCallback((i: number) => {
    return i % 2 == 0 ? 20 : 30
  }, [])

  const scrollBarSize = 14
  const totalWidth = 800
  const totalHeight = 600

  const makeCellData = {
    table: table,
    selection: state.selection,
    editing: state.editing,
  }

  return (
    <TableContext.Provider value={table}>
      <TableDispatcherContext.Provider value={dispatch}>
        <div onKeyDown={onKeyDown} tabIndex={1} ref={ref} className="spx">
          <div style={{ display: 'flex' }}>
            <div style={{ width: 30 }}>&nbsp;</div>
            <VariableSizeList
              ref={colHeadRef}
              itemData={state}
              itemCount={state.data.colNum}
              itemSize={columnWidth}
              height={30}
              width={totalWidth - scrollBarSize}
              layout={'horizontal'}
              style={{ overflow: 'hidden' }}
            >
              {makeColumnHead}
            </VariableSizeList>
          </div>
          <div style={{ display: 'flex' }}>
            <VariableSizeList
              ref={rowHeadRef}
              itemData={state}
              itemCount={state.data.rowNum}
              itemSize={columnHeight}
              height={totalHeight - scrollBarSize}
              width={30}
              layout={'vertical'}
              style={{ overflow: 'hidden' }}
            >
              {makeRowHead}
            </VariableSizeList>
            <VariableSizeGrid
              itemData={state}
              columnCount={state.data.colNum}
              rowCount={state.data.rowNum}
              columnWidth={columnWidth}
              rowHeight={columnHeight}
              height={totalHeight}
              width={totalWidth}
              onScroll={onScroll}
            >
              {MakeCell}
            </VariableSizeGrid>
          </div>
        </div>
      </TableDispatcherContext.Provider>
    </TableContext.Provider>
  )
}
