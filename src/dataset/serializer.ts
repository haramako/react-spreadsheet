import { CellType } from '../spreadsheet'
import { Dataset } from './dataset'

export type DataFile = {
  [tableName: string]: {
    columns: { key: string; name?: string; type: CellType }[]
    items: any[]
  }
}

export function saveDataset(dataset: Dataset) {
  const json: DataFile = {}
  dataset.tables.forEach((t) => {
    const columns = t.headers.map((h) => ({
      key: h.key,
      name: h.name,
      type: h.type,
    }))
    const items = dataset.indices.get(t.name)!
    json[t.name] = { columns, items }
  })
  return json
}

export function loadDataset(dataset: Dataset, data: DataFile) {
  for (let tableName in data) {
    let { columns, items } = data[tableName]
    dataset.createTable(
      tableName,
      columns.map((c) => ({
        key: c.key,
        name: c.name ?? c.key,
        type: c.type,
      })),
    )

    for (let row of items) {
      row._type = tableName
    }
    dataset.batchInsert(items)
  }
}
