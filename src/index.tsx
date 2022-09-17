import React, {
  forwardRef,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './board.css'
import reportWebVitals from './reportWebVitals'
import { SpreadSheet } from './SpreadSheet'
import { JSONTable, Table } from './table'
import { loadTsv } from './loadTsv'
import SpreadSheetFilter from './SpreadSheetFilter'
import { ICell, ITable } from './model'

const data = [
  { name: 'slime', hp: 10 },
  { name: 'bat', hp: 20 },
]

type AppState = {
  table: ITable
  view: TableView
  filter: string
}

class TableView implements ITable {
  table: ITable
  filter: string = ''
  rows: number[] = []

  constructor(table: ITable) {
    this.table = table
    this.setFilter('')
  }

  setFilter(v: string) {
    this.filter = v
    this.rows = []
    if (v === '') {
      for (let i = 0; i < this.table.rowNum; i++) {
        this.rows.push(i)
      }
    } else {
      for (let i = 0; i < this.table.rowNum; i++) {
        for (let col = 0; col < this.table.colNum; col++) {
          const value = this.table.get(i, col).value
          if (value.toString().includes(v)) {
            this.rows.push(i)
            break
          }
        }
      }
    }
  }

  get colNum() {
    return this.table.colNum
  }
  get rowNum() {
    return this.rows.length
  }

  getHeader(col: number) {
    return this.table.getHeader(col)
  }
  get(row: number, col: number): ICell {
    return this.table.get(this.rows[row], col)
  }
}

export function reduceApp(state: AppState, action: any): AppState {
  switch (action.type) {
    case 'set_table':
      const table = action.table
      const view = new TableView(table)
      return { ...state, table, view }
    case 'filter.set':
      const filter = action.value
      if (filter === '') {
        state.view.setFilter(filter)
        return { ...state, filter }
      } else {
        state.view.setFilter(filter)
        return { ...state, filter }
      }
    default:
      throw new Error(`unknown type ${action.type}`)
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reduceApp, {
    filter: '',
    table: new JSONTable(data),
    view: new TableView(new JSONTable(data)),
  })

  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!loaded) {
      setLoaded(true)
      fetch('/data.tsv')
        .then((res) => res.text())
        .then((txt) => {
          const json = loadTsv(txt)
          console.log(json.length)
          dispatch({ type: 'set_table', table: new JSONTable(json) })
        })
    }
  }, [])

  return (
    <>
      <div>
        <SpreadSheetFilter value={state.filter} {...{ dispatch }} />
      </div>
      <SpreadSheet table={state.view} />
    </>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
