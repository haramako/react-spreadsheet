import { Dataset } from './dataset'
import { ITable } from '../spreadsheet'

function tableToData(table: ITable): any[][] {
  const r: any[][] = []
  for (let row = 0; row < table.rowNum; row++) {
    const d = []
    for (let col = 0; col < table.colNum; col++) {
      d.push(table.get(row, col).value)
    }
    r.push(d)
  }
  return r
}

describe('Dataset.constructor', () => {
  const ds = new Dataset()

  ds.createTable('character', [{ name: 'name' }, { name: 'age' }])

  expect(ds.tables.get('character')!.name).toEqual('character')
  expect(ds.tables.get('character')!.headers.length).toEqual(2)

  ds.insert({ _type: 'character', name: 'miku', age: 18 })
  ds.insert({ _type: 'character', name: 'ren', age: 15 })

  expect(ds.rows.size).toEqual(2)
})

describe('DataSet', () => {
  let ds: Dataset

  beforeEach(() => {
    ds = new Dataset()
    ds.createTable('character', [{ name: 'name' }, { name: 'age' }])
    ds.insert({
      _guid: 1,
      _type: 'character',
      name: 'miku',
      age: 16,
      male: false,
    })
    ds.insert({
      _guid: 2,
      _type: 'character',
      name: 'rin',
      age: 14,
      male: false,
    })
    ds.insert({
      _guid: 3,
      _type: 'character',
      name: 'ren',
      age: 14,
      male: true,
    })
  })

  it('#select', () => {
    expect(ds.select('character', (r) => r.age == 14)).toMatchObject([
      { name: 'rin' },
      { name: 'ren' },
    ])
  })

  it('#selectAsTable', () => {
    const t = tableToData(ds.selectAsTable('character'))
    expect(t).toEqual([
      ['miku', 16],
      ['rin', 14],
      ['ren', 14],
    ])
  })

  it('#selectAsTable with columns', () => {
    const t = tableToData(ds.selectAsTable('character', undefined, ['age']))
    expect(t).toEqual([[16], [14], [14]])
  })

  it('#selectAsTable, cell has initial state', () => {
    const t = ds.selectAsTable('character')
    expect(t.get(0, 0).version).toEqual(0)
    expect(t.get(0, 0).error).toEqual(undefined)
  })

  it('#selectAsTable, cell can changes value', () => {
    const t = ds.selectAsTable('character')
    t.get(0, 0).value = 'miku v2'

    expect(t.get(0, 0).version).toEqual(1)
    expect(tableToData(t)[0][0]).toEqual('miku v2')
  })

  it('#selectAsTable, cell can changes error', () => {
    const t = ds.selectAsTable('character')
    t.get(0, 0).error = ['a', 'b']

    expect(t.get(0, 0).version).toEqual(1)
    expect(t.get(0, 0).error).toEqual(['a', 'b'])
  })
})
