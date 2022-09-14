// Copy from https://codesandbox.io/s/strange-feistel-kwsed?file=/grid-with-sticky-cells.jsx

import React from 'react'
import { VariableSizeGrid } from 'react-window'

function getCellIndicies(child: any) {
  return { row: child.props.rowIndex, column: child.props.columnIndex }
}

function getShownIndicies(children: any) {
  let minRow = Infinity
  let maxRow = -Infinity
  let minColumn = Infinity
  let maxColumn = -Infinity

  React.Children.forEach(children, (child) => {
    const { row, column } = getCellIndicies(child)
    minRow = Math.min(minRow, row)
    maxRow = Math.max(maxRow, row)
    minColumn = Math.min(minColumn, column)
    maxColumn = Math.max(maxColumn, column)
  })

  return {
    from: {
      row: minRow,
      column: minColumn,
    },
    to: {
      row: maxRow,
      column: maxColumn,
    },
  }
}

export function useInnerElementType(
  Cell: any,
  columnWidth: (n: number) => number,
  rowHeight: (n: number) => number,
) {
  return React.useMemo(
    () =>
      React.forwardRef<HTMLDivElement>((props: any, ref) => {
        function sumRowsHeights(index: number) {
          let sum = 0

          while (index > 1) {
            sum += rowHeight(index - 1)
            index -= 1
          }

          return sum
        }

        function sumColumnWidths(index: number) {
          let sum = 0

          while (index > 1) {
            sum += columnWidth(index - 1)
            index -= 1
          }

          return sum
        }

        const shownIndecies = getShownIndicies(props.children)

        const children = React.Children.map(props.children, (child) => {
          const { column, row } = getCellIndicies(child)

          // do not show non-sticky cell
          if (column === 0 || row === 0) {
            return null
          }

          return child
        })

        children.push(
          React.createElement(Cell, {
            key: '0:0',
            rowIndex: 0,
            columnIndex: 0,
            style: {
              display: 'inline-flex',
              width: columnWidth(0),
              height: rowHeight(0),
              position: 'sticky',
              top: 0,
              left: 0,
              zIndex: 4,
            },
          }),
        )

        const shownColumnsCount =
          shownIndecies.to.column - shownIndecies.from.column

        for (let i = 1; i <= shownColumnsCount; i += 1) {
          const columnIndex = i + shownIndecies.from.column
          const rowIndex = 0
          const width = columnWidth(columnIndex)
          const height = rowHeight(rowIndex)

          const marginLeft = i === 1 ? sumColumnWidths(columnIndex) : undefined

          children.push(
            React.createElement(Cell, {
              key: `${rowIndex}:${columnIndex}`,
              rowIndex,
              columnIndex,
              style: {
                display: 'inline-flex',
                marginLeft,
                width,
                height,
                position: 'sticky',
                top: 0,
                zIndex: 3,
              },
            }),
          )
        }

        const shownRowsCount = shownIndecies.to.row - shownIndecies.from.row

        for (let i = 1; i <= shownRowsCount; i += 1) {
          const columnIndex = 0
          const rowIndex = i + shownIndecies.from.row
          const width = columnWidth(columnIndex)
          const height = rowHeight(rowIndex)

          const marginTop = i === 1 ? sumRowsHeights(rowIndex) : undefined

          children.push(
            React.createElement(Cell, {
              key: `${rowIndex}:${columnIndex}`,
              rowIndex,
              columnIndex,
              style: {
                marginTop,
                width,
                height,
                position: 'sticky',
                left: 0,
                zIndex: 2,
              },
            }),
          )
        }

        return (
          <div ref={ref} {...props}>
            {children}
          </div>
        )
      }),
    [Cell, columnWidth, rowHeight],
  )
}

export function VariableSizeGridWithStickyCells(props: any) {
  return (
    <VariableSizeGrid
      {...props}
      innerElementType={useInnerElementType(
        props.children,
        props.columnWidth,
        props.rowHeight,
      )}
    />
  )
}
