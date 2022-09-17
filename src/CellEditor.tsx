import { useCallback, useEffect, useRef, useState } from 'react'
import { Position, ICell } from './model'
import { useTableDispatcher } from './SpreadSheet'

type CellEditorProps = {
  cell: ICell
  value: string
  location: Position
}

const useAutoFocus = () => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
  const onChange = useCallback((newValue: string) => {
    setVal(newValue)
  }, [])

  const inputRef = useAutoFocus()

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        dispatch({ type: 'editor.end', location, newValue: val })
        dispatch({ type: 'cursor.move', dx: 0, dy: 1 })
        e.preventDefault()
      }
    },
    [val, dispatch, location],
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
        ref={inputRef}
        style={{ display: 'inline-block', width: '100%', height: '100%' }}
        value={val}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}

export default CellEditor
