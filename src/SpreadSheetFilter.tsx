import { Input } from '@mui/material'
import React from 'react'

type SpreadSheetFilterProps = {
  value: string
  onChange: (newValue: string) => void
}

const SpreadSheetFilter: React.FC<SpreadSheetFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <Input
      id="outlined-basic"
      placeholder="Filter"
      size="small"
      onChange={(e) => onChange(e.target.value)}
      {...{ value }}
    />
  )
}

export default SpreadSheetFilter
