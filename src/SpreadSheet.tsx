import { stringify } from 'querystring'
import React, {
  useState,
  useRef,
  MouseEvent,
  useCallback,
  ChangeEventHandler,
  useEffect,
} from 'react'
import ReactDOM from 'react-dom'
import internal from 'stream'
import { setConstantValue, textChangeRangeIsUnchanged } from 'typescript'
import './spreadsheet.css'
import { Location, Selection, DataSet, CellData } from './model'
import { iota } from './util'
import { tab } from '@testing-library/user-event/dist/tab'

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
  value: CellData
  events: CellEvents
  editorEvents: CellEditorEvents
}

export const Cell: React.FC<CellProps> = ({
  location,
  value,
  events,
  editorEvents,
  selected,
  editing,
  selection,
}) => {
  const [curVal, setCurVal] = useState(value.value)
  const onClick = useCallback(() => {
    events.onClick(location)
  }, [events, location])
  const onDoubleClick = useCallback(() => {
    events.onDoubleClick(location)
  }, [events, location])
  value.onChange(() => {
    setCurVal(value.value)
  })
  const style: any = {}
  var isSelect = false
  if (Location.equals(selected, location)) {
    style.backgroundColor = '#0f8'
    isSelect = true
  } else if (selection.contains(location)) {
    style.backgroundColor = 'cyan'
  }
  if (Location.equals(editing, location)) {
    return (
      <td className="spx__cell">
        <CellEditor value={value} {...{ location, editorEvents }} />
      </td>
    )
  } else {
    return (
      <td className="spx__cell" style={style} {...{ onClick, onDoubleClick }}>
        {curVal}
      </td>
    )
  }
}

//=================================================
// Row
//=================================================

type RowProps = {
  selected?: Location
  editing?: Location
  selection: Selection
  data: DataSet
  row: number
  events: CellEvents
  editorEvents: CellEditorEvents
}

export const Row: React.FC<RowProps> = ({
  row,
  data,
  events,
  editorEvents,
  selected,
  editing,
  selection,
}) => {
  return (
    <tr className="spx__row">
      {iota(data.colNum, (col) => (
        <Cell
          key={`${row}-${col}`}
          value={data.get(row, col)}
          location={{ row, col }}
          {...{ events, editorEvents, selected, editing, selection }}
        />
      ))}
    </tr>
  )
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
// HeadRow
//=================================================

type HeadRowProps = {
  value: string[]
}

export const HeadRow: React.FC<HeadRowProps> = (props) => {
  return (
    <thead className="spx__head">
      <tr>
        {props.value.map((p, idx) => (
          <HeadCell key={`h${idx}`} value={p} />
        ))}
      </tr>
    </thead>
  )
}

//=================================================
// CellEditor
//=================================================

type CellEditorEvents = {
  onKeyDown?: (key: string, shift: boolean, ctrl: boolean) => void
  onChange?: (loc: Location, newValue: string) => void
}

type CellEditorProps = {
  value: CellData
  location: Location
  editorEvents: CellEditorEvents
}

export const CellEditor: React.FC<CellEditorProps> = ({
  value,
  location,
  editorEvents,
}) => {
  const [val, setVal] = useState(value.value)
  const onChange = useCallback(
    (newValue: string) => {
      setVal(newValue)
    },
    [val],
  )
  const onKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      key: string,
      shift: boolean,
      ctrl: boolean,
    ) => {
      if (key == 'Enter') {
        editorEvents.onChange!(location, val)
        e.preventDefault()
      }
    },
    [val, editorEvents, location],
  )
  return (
    <div className="spx__cell-editor">
      <input
        type="text"
        autoFocus
        value={val}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => onKeyDown(e, e.key, e.shiftKey, e.ctrlKey)}
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

  onEditorKeyDown() {}
}

//=================================================
// SpreadSheet
//=================================================
type SpreadSheetProps = {
  header: string[]
  value: number[][]
  onClick: () => void
}

export const SpreadSheet: React.FC = () => {
  const data = new DataSet(30, 8)
  const head = [...Array(data.colNum)].map((_, i) =>
    String.fromCharCode('A'.charCodeAt(0) + i),
  )

  const selector = new Selector(data.rowNum, data.colNum)
  let [selected, setSelected] = useState<Location | undefined>()
  let [selectStart, setSelectStart] = useState<Location | undefined>()
  let [editing, setEditing] = useState<Location | undefined>()
  let [selection, setSelection] = useState<Selection>(new Selection(0, 0, 0, 0))

  function onKeyDown(
    e: React.KeyboardEvent,
    key: string,
    shift: boolean,
    ctrl: boolean,
  ) {
    if (editing) return
    if (!selected) return
    console.log(key)
    const result = selector.onKeyDown(
      selection,
      selected,
      selectStart!,
      key,
      shift,
      ctrl,
    )
    if (result) {
      const [newSelection, newLoc, newStart] = result
      setSelection(newSelection)
      setSelected(newLoc)
      setSelectStart(newStart)
      e.preventDefault()
    } else if (
      key.length == 1 &&
      key.charCodeAt(0) > 0x20 &&
      key.charCodeAt(0) <= 0x7e
    ) {
      setEditing(selected)
    }
  }
  function onClick(loc: Location) {
    setSelectStart(loc)
    setSelected(loc)
    setSelection(new Selection(loc))
    setEditing(undefined)
  }
  function onDoubleClick(loc: Location) {
    setEditing(loc)
  }
  function onEditorKeyDown(key: string) {
    console.log(key)
  }
  function onEditorChange(loc: Location, newValue: string) {
    setEditing(undefined)
    tableElement.current!.focus()
    var newLoc = selector.move(selected!, 0, 1)
    data.get(loc.row, loc.col).value = newValue
    setSelected(newLoc)
    setSelection(new Selection(newLoc))
  }
  const events = { onClick, onDoubleClick }
  const editorEvents = { onKeyDown: onEditorKeyDown, onChange: onEditorChange }
  const tableElement = useRef<HTMLTableElement>(null)

  return (
    <div className="spx-outer">
      <table
        className="spx"
        ref={tableElement}
        tabIndex={0}
        onKeyDown={(e) => onKeyDown(e, e.key, e.shiftKey, e.ctrlKey)}
      >
        <HeadRow value={head} />
        <tbody className="spx__body">
          {iota(data.rowNum, (row) => (
            <Row
              key={`${row}`}
              {...{
                row,
                data,
                events,
                editorEvents,
                selected,
                editing,
                selection,
              }}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
