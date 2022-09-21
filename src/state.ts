import { CellType } from './spreadsheet'
import { Dataset } from './dataset'
import { atom, selector } from 'recoil'

type ViewLink = { name: string }

type DataFile = {
  [tableName: string]: {
    columns: { key: string; name?: string; type: CellType }[]
    items: any[]
  }
}

async function createDataset() {
  const ds = new Dataset()

  await fetch('/data.json')
    .then((res) => res.json())
    .then((data: DataFile) => {
      for (let tableName in data) {
        let { columns, items } = data[tableName]
        ds.createTable(
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
        ds.batchInsert(items)
      }
    })

  return ds
}

export const datasetVersionState = atom({
  key: 'datasetVersion',
  default: 0,
})

export const datasetState = selector({
  key: 'dataset',
  get: async ({ get }) => createDataset(),
})

export const viewLinksState = selector<ViewLink[]>({
  key: 'viewLinks',
  get: async ({ get }) => {
    const dataset = await get(datasetState)
    return [...dataset.tables.keys()].map((name) => ({ name }))
  },
})
