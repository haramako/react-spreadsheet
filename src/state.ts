import { DataFile, Dataset, loadDataset } from './dataset'
import { atom, selector } from 'recoil'
import { recoilPersist } from 'recoil-persist'
import { HeaderData, ICell, ITable, Position, Selection } from './spreadsheet'

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

type SelectionState = {
  cursor?: Position
  selection: Selection
}

export const selectionState = atom<SelectionState>({
  key: 'selection',
  default: {
    cursor: undefined,
    selection: new Selection(0, 0, 0, 0),
  },
})

function filterFunc(filter: string) {
  return (row: any, headers: HeaderData[]): boolean => {
    if (filter === '') {
      return true
    } else {
      for (let h of headers) {
        if (!row[h.key]) {
          return false
        } else if (row[h.key].toString().includes(filter)) {
          return true
        }
      }
      return false
    }
  }
}

export const filterState = atom({
  key: 'filter',
  default: { filter: '', version: 0 },
})
export const selectedViewLinkState = atom({
  key: 'selectedViewLink',
  default: 'enemy',
})

export const viewState = selector({
  key: 'view',
  get: ({ get }) => {
    const dataset = get(datasetState)
    const filter = get(filterState)
    const viewLink = get(selectedViewLinkState)
    return dataset.selectAsTable(viewLink, filterFunc(filter.filter))
  },
})
