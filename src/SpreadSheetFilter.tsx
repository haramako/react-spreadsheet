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
    <div>
      Filter:{' '}
      <input
        type="text"
        onChange={(e) => onChange(e.target.value)}
        {...{ value }}
      />
    </div>
  )
}

export default SpreadSheetFilter
