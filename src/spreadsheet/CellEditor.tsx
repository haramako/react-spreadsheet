import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Position } from './model'
import {
  cancelCellEdit,
  setCellTempValue,
  setCursor,
} from './reduceSpreadSheet'
import { useTableDispatcher } from './contexts'

type CellEditorProps = {
  value: string
  location: Position
}

const useAutoFocus = () => {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true })
      inputRef.current.select()
    }
  }, [])

  return inputRef
}

const CellEditor: React.FC<CellEditorProps> = ({ value, location }) => {
  const dispatch = useTableDispatcher()
  const [val, setVal] = useState(value)
  const onChange = useCallback(
    (newValue: string) => {
      setVal(newValue)
      dispatch(setCellTempValue(newValue, location))
    },
    [dispatch, location],
  )

  const inputRef = useAutoFocus()

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (e.key === 'Enter') {
        dispatch(
          setCursor(Position.from(location.row + 1, location.col), false),
        )
        e.preventDefault()
      } else if (e.key === 'Escape') {
        dispatch(cancelCellEdit())
      }
    },
    [dispatch, location],
  )
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (location) {
      const id = `#cell-${location.row}-${location.col}`
      const cellElement = document.querySelector<HTMLDivElement>(id)
      const cellStyle = cellElement?.style
      if (cellStyle && ref.current) {
        var style = ref.current.style
        style.left = cellStyle.left
        style.top = cellStyle.top
        style.width = cellStyle.width
        style.height = cellStyle.height
      }
    }
  }, [location])

  return (
    <div
      className="spx__cell-editor"
      ref={ref}
      style={{ zIndex: 2, position: 'absolute' }}
    >
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        style={{ display: 'inline-block', width: '100%', height: '100%' }}
        value={val}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}

export default CellEditor
