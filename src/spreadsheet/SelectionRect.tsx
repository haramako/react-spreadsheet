import { useEffect, useRef, useState } from 'react'
import shallowEquals from 'shallow-equals'
import { Selection } from './model'

type SelectionRectProps = {
  selection: Selection
}

type StyleRect = {
  top: number
  left: number
  right: number
  bottom: number
}

function getCellRect(row: number, col: number): StyleRect | undefined {
  const id = `#cell-${row}-${col}`
  const cellElement = document.querySelector<HTMLDivElement>(id)
  if (cellElement) {
    const { left, top, width, height } = cellElement.style
    const leftNumber = parseInt(left)
    const topNumber = parseInt(top)
    const right = leftNumber + parseInt(width)
    const bottom = topNumber + parseInt(height)
    return { left: leftNumber, top: topNumber, right, bottom }
  } else {
    return undefined
  }
}

const SelectionRect: React.FC<SelectionRectProps> = ({ selection }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [rect, setRect] = useState<StyleRect | null>(null)

  useEffect(() => {
    if (ref.current) {
      const topLeft = getCellRect(selection.top, selection.left)
      const topRight = getCellRect(selection.top, selection.right - 1)
      const bottomLeft = getCellRect(selection.bottom - 1, selection.left)
      const bottomRight = getCellRect(selection.bottom - 1, selection.right - 1)
      const r: any = { ...rect }
      if (topLeft) {
        r.left = topLeft.left
        r.top = topLeft.top
      }
      if (topRight) {
        r.right = topRight.right
        r.top = topRight.top
      }
      if (bottomLeft) {
        r.left = bottomLeft.left
        r.bottom = bottomLeft.bottom
      }
      if (bottomRight) {
        r.right = bottomRight.right
        r.bottom = bottomRight.bottom
      }

      if (
        r.left !== undefined &&
        r.top != undefined &&
        r.right != undefined &&
        r.bottom != undefined
      ) {
        if (!shallowEquals(rect, r)) {
          setRect(r)
        }
      }
    }
  }, [selection.top, selection.left, selection.bottom, selection.right, rect])

  const styleRect = rect && {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.right - rect.left + 'px',
    height: rect.bottom - rect.top + 'px',
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
