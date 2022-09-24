import { TextareaAutosize } from '@mui/material'
import React, { useState } from 'react'
import { useRecoilValue } from 'recoil'
import { ICell } from './spreadsheet'
import { selectedCellState } from './state'

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
  const selectedCell = useRecoilValue(selectedCellState)
  const Editor = StringEditor
  const onChange = () => {}

  return (
    <div>
      {selectedCell && (
        <Editor
          key={selectedCell.guid}
          cell={selectedCell}
          onChange={onChange}
        />
      )}
    </div>
  )
}
