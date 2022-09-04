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
import {
    Location,
    Selection,
    IDataSetView,
    ICellView,
    IHeaderView,
} from './model'
import { DataSet } from './table'
import { iota } from './util'

//=================================================
// Cell
//=================================================

type CellProps = {
    location: Location
    cell: ICellView
    selected: boolean
    editing: boolean
    dispatch: React.Dispatch<any>
}

export const Cell: React.FC<CellProps> = React.memo(
    ({ location, cell, selected, editing, dispatch }) => {
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
        if (selected) {
            style.backgroundColor = 'cyan'
        }
        if (editing) {
            return (
                <td className="spx__cell">
                    <CellEditor cell={cell} {...{ dispatch, location }} />
                </td>
            )
        } else {
            return (
                <td
                    className="spx__cell"
                    style={style}
                    {...{ onClick, onDoubleClick }}
                >
                    {cell.value}
                </td>
            )
        }
    },
)

//=================================================
// HeadCell
//=================================================z

type HeadCellProps = {
    value: IHeaderView
}

export const HeadCell: React.FC<HeadCellProps> = React.memo((props) => {
    return <th className="spx__head-cell">{props.value.name}</th>
})

//=================================================
// RowHeadCell
//=================================================

type RowHeadCellProps = {
    value: number
}

export const RowHeadCell: React.FC<RowHeadCellProps> = React.memo(
    ({ value }) => {
        return <th className="spx__row-head-cell">{value}</th>
    },
)

//=================================================
// CellEditor
//=================================================

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
            if (state.shift) {
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

//=================================================
// SpreadSheet
//=================================================
type SpreadSheetState = {
    data: IDataSetView
    selected?: Location
    selectStart?: Location
    selection: Selection
    editing?: Location
    shift: boolean
    tableRef: React.RefObject<HTMLTableElement>
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

export const SpreadSheet: React.FC = () => {
    const ref = useRef<HTMLTableElement>(null)
    const [state, dispatch] = useReducer(reduceSpreadSheet, {
        data: new DataSet(30, 8),
        selection: new Selection(0, 0, 0, 0),
        shift: false,
        tableRef: ref,
    })

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (state.editing) return
            if (!state.selected) return
            if (e.key == 'Shift') {
                dispatch({ type: 'cursor.start_shift' })
            } else if (!e.ctrlKey && isNormalKey(e.key)) {
                dispatch({ type: 'cursor.start_edit' })
            } else if (e.key == 'F2') {
                dispatch({ type: 'cursor.start_edit' })
            } else {
                let d = keyToCursor(e.key)
                if (d) {
                    dispatch({ type: 'cursor.move', dx: d[0], dy: d[1] })
                    e.preventDefault()
                }
            }
        },
        [state, dispatch],
    )

    const onKeyUp = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key == 'Shift') {
                dispatch({ type: 'cursor.end_shift' })
            }
        },
        [state, dispatch],
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
                        <th className="spx__super-head-cell"></th>
                        {iota(state.data.colNum, (col) => {
                            return (
                                <HeadCell
                                    key={'h-' + col}
                                    value={state.data.getHeader(col)}
                                />
                            )
                        })}
                    </tr>
                </thead>
                <tbody className="spx__body">
                    {iota(state.data.rowNum, (row) => (
                        <tr className="spx__row" key={row}>
                            <RowHeadCell key={'r-' + row} value={row} />
                            {iota(state.data.colNum, (col) => {
                                const location = Location.from(row, col)
                                let editing = Location.equals(
                                    state.editing,
                                    location,
                                )
                                let selected =
                                    state.selection.contains(location)

                                return (
                                    <Cell
                                        key={`${row}-${col}`}
                                        cell={state.data.get(row, col)}
                                        {...{
                                            selected,
                                            editing,
                                            dispatch,
                                            location,
                                        }}
                                    />
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

//=================================================
//
//=================================================
