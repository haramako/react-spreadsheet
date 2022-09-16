import React, {
  useState,
  useRef,
  useCallback,
  useReducer,
  useLayoutEffect,
  createContext,
  useContext,
  ReactPortal,
} from 'react'
import './spreadsheet.css'
import {
  Position,
  Selection,
  ITable,
  IHeader,
  ValueValidatorCollection,
} from './model'
import {
  BooleanValidator,
  IntegerValidator,
  NumberValidator,
  StringValidator,
} from './validators'
import {
  VariableSizeGrid,
  VariableSizeList,
  GridOnScrollProps,
  GridChildComponentProps,
  ListChildComponentProps,
} from 'react-window'
import shallowEquals from 'shallow-equals'
import Cell from './Cell'
import CellEditor from './CellEditor'
import { createPortal } from 'react-dom'
import SelectionRect from './SelectionRect'
import { reduceSpreadSheet, SpreadSheetState } from './reduceSpreadSheet'

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
// reduceSpreadSheet
//=================================================
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
    key.length === 1 && key.charCodeAt(0) > 0x20 && key.charCodeAt(0) <= 0x7e
  )
}

type SpreadSheetProps = {
  table: ITable
}

function MakeCell({
  columnIndex,
  rowIndex,
  style,
  data,
}: GridChildComponentProps<SpreadSheetState>) {
  // `style` is created every render, so keep identity if not change.
  const [savedStyle, setSavedStyle] = useState(style)
  if (!shallowEquals(style, savedStyle)) {
    setSavedStyle(style)
  }

  const location = Position.from(rowIndex, columnIndex)
  const cell = data.data.get(rowIndex, columnIndex)
  const header = data.data.getHeader(columnIndex)
  const editing = Position.equals(data.editing, location)
  const selected = data.selection.contains(location)
  return (
    <Cell
      {...{
        style: savedStyle,
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
  const ref = useRef<HTMLDivElement>(null)
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
      } else if (e.key === 'F2') {
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
    return i % 2 === 0 ? 80 : 100
  }, [])

  const columnHeight = useCallback((i: number) => {
    return i % 2 === 0 ? 20 : 30
  }, [])

  const scrollBarSize = 14
  const totalWidth = 800
  const totalHeight = 600

  const innerRef = useRef<HTMLDivElement>(null)

  // Create editor portal.
  let editorPortal: ReactPortal | null = null
  if (innerRef.current && state.editing) {
    const cell = table.get(state.editing.row, state.editing.col)
    const value = cell.value
    editorPortal = createPortal(
      <CellEditor location={state.editing} {...{ cell, dispatch, value }} />,
      innerRef.current,
    )
  }

  // Create selection rect portal.
  let selectionRectPortal: ReactPortal | null = null
  if (innerRef.current && !state.selection.isNone()) {
    selectionRectPortal = createPortal(
      <SelectionRect selection={state.selection} />,
      innerRef.current,
    )
  }

  function findAncestor(e: HTMLElement, sel: string) {
    for (let el: HTMLElement | null = e; el; el = el.parentElement) {
      if (el.matches(sel)) {
        return el
      }
    }
    return null
  }

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const t2 = findAncestor(e.target as HTMLElement, '.spx__cell')
    console.log(
      t2?.getAttribute('id'),
      e.bubbles,
      e.defaultPrevented,
      e.eventPhase,
    )
  }, [])

  return (
    <TableContext.Provider value={table}>
      <TableDispatcherContext.Provider value={dispatch}>
        <div tabIndex={1} className="spx" {...{ ref, onKeyDown, onClick }}>
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
              innerRef={innerRef}
            >
              {MakeCell}
            </VariableSizeGrid>
          </div>
        </div>
        {editorPortal}
        {selectionRectPortal}
      </TableDispatcherContext.Provider>
    </TableContext.Provider>
  )
}
