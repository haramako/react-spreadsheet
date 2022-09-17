import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import reportWebVitals from './reportWebVitals'
import { SpreadSheet } from './SpreadSheet'
import { loadTsv } from './loadTsv'
import SpreadSheetFilter from './SpreadSheetFilter'
import { ITable } from './model'
import { Dataset } from './dataset'
import { HeaderData } from './table'

const data: any[] = [
  { name: 'slime', hp: 10 },
  { name: 'bat', hp: 20 },
]

let curGuid = 1
for (let row of data) {
  row._guid = curGuid++
  row._order = row._guid
}

type ViewLink = { name: string; func: (data: any) => ITable }

type AppState = {
  dataset: Dataset
  view?: ITable
  filter: string
  viewLinks: ViewLink[]
  viewLink: ViewLink
}

function filterFunc(filter: string) {
  return (row: any, headers: HeaderData[]): boolean => {
    if (filter === '') {
      return true
    } else {
      for (let h of headers) {
        if (row[h.name].toString().includes(filter)) {
          return true
        }
      }
      return false
    }
  }
}

export function reduceApp(state: AppState, action: any): AppState {
  switch (action.type) {
    case 'set_view': {
      const viewLink: ViewLink = action.viewLink
      const view = viewLink.func(filterFunc(state.filter))
      return { ...state, viewLink, view }
    }
    case 'load_table': {
      console.log(action)
      const tableName: string = action.tableName
      const data: any[] = action.data
      for (let row of data) {
        row._type = tableName
      }
      console.log(data)
      state.dataset.batchInsert(data)
      //console.log('size', state.dataset.rows.size)
      console.log('indices', state.dataset.indices.get('character')!.length)
      return { ...state }
    }
    case 'filter.set': {
      const filter: string = action.value
      let view = state.viewLink.func(filterFunc(filter))
      return { ...state, filter, view }
    }
    default:
      throw new Error(`unknown type ${action.type}`)
  }
}

function createDataset() {
  const ds = new Dataset()

  ds.createTable('character', [
    { name: 'name' },
    { name: 'category' },
    { name: 'level' },
  ])
  ds.createTable('status_info', [
    { name: 'name' },
    { name: 'symbol' },
    { name: 'id' },
  ])

  return ds
}

async function loadFiles(dispatch: React.Dispatch<any>) {
  for (let file of ['character', 'status_info']) {
    await fetch(file + '.tsv')
      .then((res) => res.text())
      .then((txt) => {
        const json = loadTsv(txt)
        dispatch({ type: 'load_table', tableName: file, data: json })
      })
  }
}

const App: React.FC = () => {
  const dataset = useMemo(() => createDataset(), [])
  const viewLinks: ViewLink[] = [
    {
      name: 'character',
      func: (filter) => {
        return dataset.selectAsTable('character', filter)
      },
    },
    {
      name: 'status_info',
      func: (filter) => {
        return dataset.selectAsTable('status_info', filter)
      },
    },
  ]
  const [state, dispatch] = useReducer(reduceApp, {
    filter: '',
    dataset: dataset,
    viewLinks: viewLinks,
    viewLink: viewLinks[0],
  })

  const loaded = useRef(false)
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true
      loadFiles(dispatch)
    }
  }, [dispatch, loaded])

  const onViewClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const viewLink = state.viewLinks.find(
        (v) => v.name === (e.target as HTMLElement).dataset.name!,
      )!
      dispatch({ type: 'set_view', viewLink })
    },
    [state.viewLinks],
  )

  if (!loaded.current) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div>
        {state.viewLinks.map((v) => {
          return (
            <span key={v.name}>
              <button onClick={onViewClick} data-name={v.name}>
                {v.name}
              </button>
              |
            </span>
          )
        })}
      </div>
      <div>
        <SpreadSheetFilter value={state.filter} {...{ dispatch }} />
      </div>
      {state.view && <SpreadSheet table={state.view} />}
    </>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
/*
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
*/
root.render(<App />)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
