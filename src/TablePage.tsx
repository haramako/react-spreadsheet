import React, { useCallback } from 'react'
import { SpreadSheet } from './spreadsheet'
import SpreadSheetFilter from './SpreadSheetFilter'
import {
  datasetState,
  datasetVersionState,
  filterState,
  selectedCellState,
  selectionState,
  viewState,
} from './state'
import { useRecoilState, useRecoilValue } from 'recoil'
import { Button, ButtonGroup } from '@mui/material'
import AutoSizer from 'react-virtualized-auto-sizer'
import { useLoaderData } from 'react-router'

export async function tablePageLoader({ params }: any) {
  return params
}

type Params = {
  view: string
}

export const TablePage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const params = useLoaderData() as Params
  const dataset = useRecoilValue(datasetState)
  const selection = useRecoilValue(selectionState)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedCell, setSelectedCell] = useRecoilState(selectedCellState)
  const [datasetVersion, setDatasetVersion] =
    useRecoilState(datasetVersionState)
  const [filter, setFilter] = useRecoilState(filterState)
  const view = useRecoilValue(viewState)

  const onChange = useCallback(
    (newValue: string) => {
      setFilter({ ...filter, filter: newValue })
    },
    [filter, setFilter],
  )

  const onAddClick = useCallback(() => {
    const row = view.getRow(selection.selection.bottom - 1)
    const len = selection.selection.bottom - selection.selection.top
    for (let i = 0; i < len; i++) {
      const newOrder = dataset.getRowOrder(row.guid)
      dataset.insert({ _type: row.data._type, _order: newOrder }, true)
    }
    setDatasetVersion(datasetVersion + 1)
    setFilter({ ...filter, version: filter.version + 1 })
  }, [
    dataset,
    selection,
    view,
    filter,
    setFilter,
    setDatasetVersion,
    datasetVersion,
  ])

  function onRemoveClick() {
    const sel = selection.selection
    const rows: number[] = []
    for (let row = sel.top; row < sel.bottom; row++) {
      rows.push(view.getRow(row).guid)
    }
    for (let rowGuid of rows) {
      dataset.removeRow(rowGuid)
    }
    setDatasetVersion(datasetVersion + 1)
    setFilter({ ...filter, version: filter.version + 1 })
  }

  const sel = selection.selection

  return (
    <div style={{ display: 'grid', gridTemplateRows: '40px 1fr' }}>
      <div>
        <SpreadSheetFilter value={filter.filter} onChange={onChange} />
        <ButtonGroup size="small" variant="contained">
          <Button onClick={onAddClick}>行の追加({sel.bottom - sel.top})</Button>
          <Button onClick={onRemoveClick}>行の削除</Button>
        </ButtonGroup>
      </div>
      <div>
        <AutoSizer>
          {({ height, width }) => {
            return (
              <SpreadSheet
                table={view}
                {...{ width, height, onChangeCell: setSelectedCell }}
              />
            )
          }}
        </AutoSizer>
      </div>
    </div>
  )
}
