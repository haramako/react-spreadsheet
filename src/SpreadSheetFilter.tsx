import React, { useCallback } from 'react'

type SpreadSheetFilterProps = {
  value: string
  dispatch: React.Dispatch<any>
}

const SpreadSheetFilter: React.FC<SpreadSheetFilterProps> = ({
  value,
  dispatch,
}) => {
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'filter.set', value: e.target.value })
    },
    [dispatch],
  )
  return (
    <div>
      Filter: <input type="text" {...{ value, onChange }} />
    </div>
  )
}

export default SpreadSheetFilter
