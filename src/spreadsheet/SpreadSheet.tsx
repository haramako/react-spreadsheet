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
import { Position, Selection, ITable, IHeader, IRow, ICell } from './model'
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
import { Tooltip } from '@mui/material'

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
      <Tooltip title={value.key}>
        <div className="spx__head-cell" style={style}>
          {value.name}
        </div>
      </Tooltip>
    )
  },
)

//=================================================
// RowHeadCell
//=================================================

type RowHeadCellProps = {
  value: number
  row: IRow
  name: string
  style: any
}

export const RowHeadCell: React.FC<RowHeadCellProps> = React.memo(
  ({ value, row, name, style }) => {
    return (
      <Tooltip title={`GUID:${row.guid}`}>
        <div className="spx__row-head-cell" style={style}>
          {value}:{name}
        </div>
      </Tooltip>
    )
  },
)

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
  const row = data.data.getRow(index)
  const cell = data.data.get(index, 0)
  const name = (cell && cell.value) ?? ''
  return <RowHeadCell value={index} {...{ name, row, style, index }} />
}

function findAncestor(e: HTMLElement, sel: string) {
  for (let el: HTMLElement | null = e; el; el = el.parentElement) {
    if (el.matches(sel)) {
      return el
    }
  }
  return null
}

/**
 * Synchronize scroll data grid with column header and row header.
 * @returns
 */
function useScrollSynchronization() {
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

  return { onScroll, colHeadRef, rowHeadRef }
}

function idToPosition(id: string) {
  const found = id.match(/^cell-([0-9]+)-([0-9]+)$/)
  if (found) {
    return Position.from(parseInt(found[1]), parseInt(found[2]))
  } else {
    return null
  }
}

function getCellPosition(target: EventTarget | Element | null) {
  if (!target) {
    return null
  }
  const cell = findAncestor(target as HTMLElement, '.spx__cell')
  return cell && idToPosition(cell.id)
}

/**
 * Pointer events for selection.
 */
function usePointerEvents(dispatch: React.Dispatch<any>) {
  const [mouseDragging, setMouseDragging] = useState(false)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button === 0) {
        const location = getCellPosition(e.target)
        if (location) {
          ;(e.target as Element).setPointerCapture(e.pointerId)
          dispatch({ type: 'cursor.set', location, shiftKey: e.shiftKey })
        }
        setMouseDragging(true)
      }
    },
    [dispatch],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (mouseDragging) {
        const target = document.elementFromPoint(e.clientX, e.clientY)
        const location = getCellPosition(target)
        if (location) {
          dispatch({ type: 'cursor.set', location, shiftKey: true })
        }
      }
    },
    [mouseDragging, dispatch],
  )

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setMouseDragging(false)
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}

type SpreadSheetProps = {
  table: ITable
  width?: number
  height?: number
  onChangeCell?: (cell?: ICell) => void
}

export const SpreadSheet: React.FC<SpreadSheetProps> = ({
  table,
  width,
  height,
  onChangeCell,
}) => {
  width ??= 800
  height ??= 600
  const ref = useRef<HTMLDivElement>(null)
  const [state, dispatch] = useReducer(reduceSpreadSheet, {
    data: table,
    selection: new Selection(0, 0, 0, 0),
    tableRef: ref,
    filter: '',
    onChangeCell: undefined,
  })
  if (table !== state.data) {
    dispatch({ type: 'set_table', table: table })
  }

  if (onChangeCell !== state.onChangeCell) {
    dispatch({ type: 'set_onChangeCell', onChangeCell })
  }

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

  const { onScroll, colHeadRef, rowHeadRef } = useScrollSynchronization()
  const { onPointerDown, onPointerMove, onPointerUp } =
    usePointerEvents(dispatch)

  const columnWidth = useCallback((i: number) => {
    return i % 2 === 0 ? 80 : 100
  }, [])

  const columnHeight = useCallback((i: number) => {
    return 20
    //return i % 2 === 0 ? 20 : 30
  }, [])

  const scrollBarSize = 14

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

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY)
      const location = getCellPosition(target)
      if (location) {
        dispatch({ type: 'cell.doubleclick', location })
      }
    },
    [dispatch],
  )

  return (
    <TableContext.Provider value={table}>
      <TableDispatcherContext.Provider value={dispatch}>
        <div
          style={{ width, height }}
          tabIndex={1}
          className="spx"
          {...{
            ref,
            onKeyDown,
            onDoubleClick,
            onPointerDown,
            onPointerMove,
            onPointerUp,
          }}
        >
          <div style={{ display: 'flex' }}>
            <div style={{ width: 240 }}>&nbsp;</div>
            <VariableSizeList
              ref={colHeadRef}
              itemData={state}
              itemCount={state.data.colNum}
              itemSize={columnWidth}
              height={30}
              width={width - 240 - scrollBarSize}
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
              height={height - 30 - scrollBarSize}
              width={240}
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
              height={height - 30}
              width={width - 240}
              onScroll={onScroll}
              innerRef={innerRef}
              overscanColumnCount={10}
              overscanRowCount={10}
              style={{ overflow: 'scroll' }}
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
