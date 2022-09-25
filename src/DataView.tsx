import { TextareaAutosize } from '@mui/material'
import React, { useState } from 'react'
import { useRecoilValue } from 'recoil'
import { ICell } from './spreadsheet'
import { selectionState, viewState } from './state'

type DataEditorProps = {
  cell: ICell
  onChange: () => void
}

export type DataEditor = React.FC<DataEditorProps>

export const StringEditor: React.FC<DataEditorProps> = ({ cell }) => {
  const [value, setValue] = useState(cell.value)
  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
  }
  return (
    <div>
      <TextareaAutosize value={value} onChange={onChange} />
    </div>
  )
}

type DataViewProps = {}

export const DataView: React.FC<DataViewProps> = () => {
  const Editor = StringEditor
  const view = useRecoilValue(viewState)
  const onChange = () => {}
  const selection = useRecoilValue(selectionState)
  let cell: ICell | undefined = undefined
  if (selection.cursor) {
    cell = view.get(selection.cursor.row, selection.cursor.col)
  }

  return (
    <div>
      {cell && <Editor key={cell.guid} cell={cell} onChange={onChange} />}
    </div>
  )
}
