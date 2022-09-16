import React, { CSSProperties, useCallback } from 'react'
import { Position, ICell, IHeader } from './model'
import { useTableDispatcher } from './SpreadSheet'
import { Visualizers } from './visualizers'

type CellProps = {
  location: Position
  header: IHeader
  cell: ICell
  version: number
  style: CSSProperties
}

const Cell: React.FC<CellProps> = React.memo(
  ({ location, cell, version, header, style }) => {
    const dispatch = useTableDispatcher()
    const onClick = useCallback(
      (e: React.MouseEvent) => {
        dispatch({ type: 'cursor.set', location, shiftKey: e.shiftKey })
      },
      [dispatch, location],
    )
    const onDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        dispatch({ type: 'cell.doubleclick', location })
      },
      [dispatch, location],
    )

    const Visualizer = Visualizers[header.type]

    let value = cell.value
    let err = cell.error
    let errMessage: string | undefined
    if (err) {
      value = err[0]
      errMessage = '(' + err[1] + ')'
      style = { ...style, backgroundColor: '#f88' }
    }

    const id = `cell-${location.row}-${location.col}`

    return (
      <div
        id={id}
        className="spx__cell"
        style={style}
        {...{ onClick, onDoubleClick }}
      >
        <Visualizer {...{ location, value, dispatch }} />
        {errMessage}
      </div>
    )
  },
)

Cell.displayName = 'Cell'

export default Cell
