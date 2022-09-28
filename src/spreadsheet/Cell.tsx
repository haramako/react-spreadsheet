import { Tooltip } from '@mui/material'
import React, { CSSProperties, ReactElement } from 'react'
import { Position, ICell, IHeader } from './model'
import { Visualizers } from './visualizers'

type CellProps = {
  location: Position
  header: IHeader
  cell: ICell
  version: number
  style: CSSProperties
}

const Cell: React.FC<CellProps> = React.memo(({ location, cell, version, header, style }) => {
  const Visualizer = Visualizers[header.type]

  if (version !== 0) {
    style = { ...style, backgroundColor: '#ff88' }
  }

  let value = cell.value
  let err = cell.error
  let errMessage: string | undefined
  if (err) {
    value = err[0]
    errMessage = 'ERROR: ' + err[1]
    style = { ...style, backgroundColor: '#f88' }
  }

  const id = `cell-${location.row}-${location.col}`

  function withError(e: ReactElement) {
    if (errMessage !== undefined) {
      return <Tooltip title={errMessage}>{e}</Tooltip>
    } else {
      return e
    }
  }

  return withError(
    <div id={id} className="spx__cell" style={style}>
      <Visualizer {...{ location, value }} />
    </div>,
  )
})

Cell.displayName = 'Cell'

export default Cell
