import { useCallback, useEffect, useRef, useState } from 'react'
import { Location, ICell } from './model'

type CellEditorProps = {
  cell: ICell
  value: string
  dispatch: React.Dispatch<any>
  location: Location
}

const useAutoFocus = () => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true })
      inputRef.current.select()
    }
  }, [])

  return inputRef
}

const CellEditor: React.FC<CellEditorProps> = ({
  cell,
  value,
  dispatch,
  location,
}) => {
  const [val, setVal] = useState(value)
  const onChange = useCallback((newValue: string) => {
    setVal(newValue)
  }, [])

  const inputRef = useAutoFocus()

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
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
        ref={inputRef}
        type="text"
        value={val}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}

export default CellEditor
