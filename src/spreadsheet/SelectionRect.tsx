import { useEffect, useRef, useState } from 'react'
import shallowEquals from 'shallow-equals'
import { Selection } from './model'

type SelectionRectProps = {
  selection: Selection
}

function getCellRect(row: number, col: number): any | null {
  const id = `#cell-${row}-${col}`
  const cellElement = document.querySelector<HTMLDivElement>(id)
  if (cellElement) {
    const { left, top } = cellElement.style
    return { left, top }
  } else {
    return null
  }
}

const SelectionRect: React.FC<SelectionRectProps> = ({ selection }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [rect, setRect] = useState<any>({})

  useEffect(() => {
    if (ref.current) {
      const topLeft = getCellRect(selection.top, selection.left)
      const topRight = getCellRect(selection.top, selection.right)
      const bottomLeft = getCellRect(selection.bottom, selection.left)
      const bottomRight = getCellRect(selection.bottom, selection.right)
      const r: any = { ...rect }
      if (topLeft) {
        r.left = topLeft.left
        r.top = topLeft.top
      }
      if (topRight) {
        r.right = topRight.left
        r.top = topRight.top
      }
      if (bottomLeft) {
        r.left = bottomLeft.left
        r.bottom = bottomLeft.top
      }
      if (bottomRight) {
        r.right = bottomRight.left
        r.bottom = bottomRight.top
      }
      if (r.left && r.top && r.right && r.bottom) {
        if (!shallowEquals(rect, r)) {
          setRect(r)
        }
      }
    }
  }, [selection.top, selection.left, selection.bottom, selection.right, rect])

  const styleRect = {
    left: rect.left,
    top: rect.top,
    width: parseInt(rect.right) - parseInt(rect.left) + 'px',
    height: parseInt(rect.bottom) - parseInt(rect.top) + 'px',
  }

  return (
    <div
      className="spx__cell-editor"
      ref={ref}
      style={{
        ...styleRect,
        zIndex: -1,
        position: 'absolute',
        backgroundColor: '#aff',
      }}
    ></div>
  )
}

export default SelectionRect
