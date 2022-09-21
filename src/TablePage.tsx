import React, { useCallback, useMemo, useState } from 'react'
import { SpreadSheet, HeaderData } from './spreadsheet'
import SpreadSheetFilter from './SpreadSheetFilter'
import { useLoaderData } from 'react-router'
import { datasetState, datasetVersionState } from './state'
import { useRecoilState, useRecoilValue } from 'recoil'
import { Button, ButtonGroup } from '@mui/material'

function filterFunc(filter: string) {
  return (row: any, headers: HeaderData[]): boolean => {
    if (filter === '') {
      return true
    } else {
      for (let h of headers) {
        if (!row[h.key]) {
          return false
        } else if (row[h.key].toString().includes(filter)) {
          return true
        }
      }
      return false
    }
  }
}

export async function tablePageLoader({ params }: any) {
  return params
}

type Params = {
  view: string
}

export const TablePage: React.FC = () => {
  const params = useLoaderData() as Params
  const dataset = useRecoilValue(datasetState)
  const [datasetVersion, setDatasetVersion] =
    useRecoilState(datasetVersionState)
  const [filter, setFilter] = useState('')
  const view = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = datasetVersion
    return dataset.selectAsTable(params.view, filterFunc(filter))
  }, [dataset, datasetVersion, params.view, filter])

  const onChange = useCallback(
    (newValue: string) => {
      setFilter(newValue)
    },
    [setFilter],
  )

  const onAddClick = useCallback(() => {
    dataset.insert({ _type: 'enemy' })
    setDatasetVersion(datasetVersion + 1)
  }, [dataset, datasetVersion, setDatasetVersion])

  return (
    <>
      <div>
        <SpreadSheetFilter value={filter} onChange={onChange} />
        <ButtonGroup size="small" variant="contained">
          <Button onClick={onAddClick}>追加</Button>
          <Button>削除</Button>
        </ButtonGroup>
      </div>
      {<SpreadSheet table={view} />}
    </>
  )
}
