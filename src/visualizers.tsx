import React, { useCallback, useState } from 'react'
import { Location } from './model'

//=================================================
// Visualizer
//=================================================
export type Visualizer = React.FC<VisualizerProps>

type VisualizerProps = {
  location: Location
  value: any
  dispatch: React.Dispatch<any>
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
  dispatch,
}) => {
  const onChange = useCallback(() => {
    dispatch({ type: 'cell.change_value', location, newValue: !value })
  }, [value, dispatch])
  return <input type="checkbox" checked={!!value} onChange={onChange} />
}

export const Visualizers: { [name: string]: Visualizer } = {
  string: StringVisualizer,
  number: NumberVisualizer,
  boolean: BooleanVisualizer,
}
