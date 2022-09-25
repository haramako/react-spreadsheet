import React, { useCallback } from 'react'
import { Position } from './model'
import { setCellValue } from './reduceSpreadSheet'
import { useTableDispatcher } from './SpreadSheet'

//=================================================
// Visualizer
//=================================================
export type Visualizer = React.FC<VisualizerProps>

type VisualizerProps = {
  location: Position
  value: any
}

export const StringVisualizer: React.FC<VisualizerProps> = ({ value }) => {
  return <div style={{ textAlign: 'left' }}>{value}</div>
}

export const NumberVisualizer: React.FC<VisualizerProps> = ({ value }) => {
  return <span>{value}</span>
}

export const BooleanVisualizer: React.FC<VisualizerProps> = ({
  location,
  value,
}) => {
  const dispatch = useTableDispatcher()
  const onChange = useCallback(() => {
    dispatch(setCellValue(!value, location))
  }, [value, dispatch, location])
  return <input type="checkbox" checked={!!value} onChange={onChange} />
}

export const ObjectVisualizer: React.FC<VisualizerProps> = ({ value }) => {
  return <div style={{ textAlign: 'left' }}>{JSON.stringify(value)}</div>
}

export const Visualizers: { [name: string]: Visualizer } = {
  string: StringVisualizer,
  object: ObjectVisualizer,
  number: NumberVisualizer,
  boolean: BooleanVisualizer,
}
