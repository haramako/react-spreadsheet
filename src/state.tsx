import { ITable } from './spreadsheet'
import { Dataset } from './dataset'
import { atom, selector } from 'recoil'

type ViewLink = { name: string; func: (dataset: Dataset, data: any) => ITable }

async function createDataset() {
  const ds = new Dataset()

  ds.createTable('character', [
    { name: 'name' },
    { name: 'category' },
    { name: 'level', type: 'number', validatorType: 'int' },
  ])
  ds.createTable('status_info', [
    { name: 'name' },
    { name: 'symbol' },
    { name: 'id', type: 'number', validatorType: 'int' },
  ])

  for (let tableName of ['character', 'status_info']) {
    await fetch('/' + tableName + '.json')
      .then((res) => res.json())
      .then((data) => {
        for (let row of data) {
          row._type = tableName
        }
        ds.batchInsert(data)
      })
  }

  return ds
}

export const datasetState = selector({
  key: 'dataset',
  get: async ({ get }) => createDataset(),
})

export const viewLinksState = atom({
  key: 'viewLinks',
  default: [
    {
      name: 'character',
      func: (dataset, filter) => {
        return dataset.selectAsTable('character', filter)
      },
    },
    {
      name: 'status_info',
      func: (dataset, filter) => {
        return dataset.selectAsTable('status_info', filter)
      },
    },
  ] as ViewLink[],
})
