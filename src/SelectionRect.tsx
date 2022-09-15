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
    const { left, top, width, height } = cellElement.style
    return { left, top, width, height }
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
      const rightBottom = getCellRect(selection.bottom, selection.right)
      const r: any = { ...rect }
      if (topLeft) {
        r.left = topLeft.left
        r.top = topLeft.top
      }
      if (rightBottom) {
        r.right = rightBottom.left
        r.bottom = rightBottom.top
      }
      if (r.left && r.top && r.right && r.bottom) {
        const newRect = {
          left: r.left,
          top: r.top,
          width: parseInt(rightBottom.left) - parseInt(r.left) + 'px',
          height: parseInt(rightBottom.top) - parseInt(r.top) + 'px',
        }
        if (!shallowEquals(rect, newRect)) {
          setRect(newRect)
        }
      }
    }
  }, [selection.top, selection.left, selection.bottom, selection.right, rect])

  return (
    <div
      className="spx__cell-editor"
      ref={ref}
      style={{
        ...rect,
        zIndex: -1,
        position: 'absolute',
        backgroundColor: '#aff',
      }}
    ></div>
  )
}

export default SelectionRect
