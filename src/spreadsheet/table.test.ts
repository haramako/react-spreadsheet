import { JSONTable } from './table'

it('JSONTable.constructor', () => {
  const data = [
    { name: 'slime', hp: 10 },
    { name: 'bat', hp: 15 },
  ]
  const t = new JSONTable(data)
  expect(t.get(0, 0).value).toEqual('slime')
  expect(t.get(0, 1).value).toEqual(10)
  expect(t.get(1, 0).value).toEqual('bat')
  expect(t.colNum).toEqual(2)
  expect(t.getHeader(0).name).toEqual('name')
})
