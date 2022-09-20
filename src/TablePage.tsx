import React, { useCallback, useMemo, useState } from 'react'
import { SpreadSheet, HeaderData } from './spreadsheet'
import SpreadSheetFilter from './SpreadSheetFilter'
import { useLoaderData } from 'react-router'
import { datasetState } from './state'
import { useRecoilValue } from 'recoil'

function filterFunc(filter: string) {
  return (row: any, headers: HeaderData[]): boolean => {
    if (filter === '') {
      return true
    } else {
      for (let h of headers) {
        if (!row[h.name]) {
          return false
        } else if (row[h.name].toString().includes(filter)) {
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
  const [filter, setFilter] = useState('')
  const view = useMemo(
    () => dataset.selectAsTable(params.view, filterFunc(filter)),
    [dataset, params.view, filter],
  )

  const onChange = useCallback(
    (newValue: string) => {
      setFilter(newValue)
    },
    [setFilter],
  )

  return (
    <>
      <div>
        <SpreadSheetFilter value={filter} onChange={onChange} />
      </div>
      {<SpreadSheet table={view} />}
    </>
  )
}
