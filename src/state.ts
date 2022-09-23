import { DataFile, Dataset, loadDataset } from './dataset'
import { atom, selector } from 'recoil'
import { recoilPersist } from 'recoil-persist'
import { ICell } from './spreadsheet'

type ViewLink = { name: string }

const { persistAtom } = recoilPersist()

export const dataPathState = atom({
  key: 'dataPath',
  default: 'data.json',
  effects_UNSTABLE: [persistAtom],
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

export const selectedCellState = atom<ICell | undefined>({
  key: 'selectedCell',
  default: undefined,
})
