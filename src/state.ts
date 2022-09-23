import { DataFile, Dataset, loadDataset } from './dataset'
import { atom, selector } from 'recoil'

type ViewLink = { name: string }

export const dataPathState = atom({
  key: 'dataPath',
  default: 'data.json',
})

async function createDataset(path: string) {
  const dataset = new Dataset()

  await fetch(path)
    .then((res) => res.json())
    .then((data) => {
      loadDataset(dataset, data as DataFile)
    })
    .catch((err) => console.log(err))

  return dataset
}

export const datasetVersionState = atom({
  key: 'datasetVersion',
  default: 0,
})

export const datasetState = selector({
  key: 'dataset',
  get: async ({ get }) => createDataset('/api/files/' + get(dataPathState)),
})

export const viewLinksState = selector<ViewLink[]>({
  key: 'viewLinks',
  get: async ({ get }) => {
    const dataset = await get(datasetState)
    return [...dataset.tables.keys()].map((name) => ({ name }))
  },
})
