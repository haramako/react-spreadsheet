import { CellType, ICell, ITable } from './model'
import { HeaderData, HeaderTemplate } from './table'

const keyCache: any = {}
function makeKey(a: string, b: string) {
  return a + '.' + b
}

//=================================================
// DataCell
//=================================================
export class DataCell implements ICell {
  #data: any
  #key: string

  constructor(data: any, key: string) {
    this.#data = data
    this.#key = key
  }

  get value() {
    return this.#data[this.#key] as string
  }

  set value(v: string) {
    if (this.error !== undefined || this.value !== v) {
      this.#data[this.#key] = v
      this.error = undefined
      this.#incVersion()
    }
  }

  get hasError(): boolean {
    return !!this.error
  }

  get error(): [string, string] | undefined {
    const errors = this.#data._additional?.errors
    if (errors) {
      return errors[this.#key]
    } else {
      return undefined
    }
  }

  set error(v: [string, string] | undefined) {
    if (this.error !== v) {
      this.#data._additional ??= {}
      this.#data._additional.errors ??= {}
      this.#data._additional.errors[this.#key] = v
      this.#incVersion()
    }
  }

  #incVersion() {
    this.#data._additional ??= {}
    this.#data._additional.versions ??= {}
    this.#data._additional.versions[this.#key] ??= 0
    this.#data._additional.versions[this.#key]++
  }

  get version() {
    const versions = this.#data._additional?.versions
    if (versions) {
      return versions[this.#key] ?? 0
    } else {
      return 0
    }
  }
}

//=================================================
// DataTable
//=================================================
export class DataTable implements ITable {
  colNum: number
  rowNum: number
  data: DataCell[][]
  headers: HeaderData[]

  constructor(data: any[], headers: HeaderData[]) {
    this.data = []
    this.headers = headers

    this.colNum = this.headers.length
    this.rowNum = data.length

    this.data = data.map((row) =>
      this.headers.map((h) => new DataCell(row, h.name)),
    )
  }

  getHeader(col: number) {
    return this.headers[col]
  }

  get(row: number, col: number) {
    return this.data[row][col]
  }
}

type Row = { _guid: number; _order: number; _type: string; [key: string]: any }

type TableInfo = {
  name: string
  headers: HeaderData[]
}

//=================================================
// Dataset
//=================================================
export class Dataset {
  rows: Map<number, Row> = new Map()
  tables: Map<string, TableInfo> = new Map()
  indices: Map<string, Row[]> = new Map()

  constructor() {}

  createTable(name: string, headers: (HeaderTemplate | HeaderData)[]) {
    this.indices.set(name, [])
    this.tables.set(name, {
      name,
      headers: headers.map((h) => HeaderData.from(h)),
    })
  }

  #newId() {
    while (true) {
      const guid = Math.floor(Math.random() * 0x8fffffffffff)
      if (!this.rows.has(guid)) {
        return guid
      }
    }
  }

  #newOrder(tableName: string) {
    const index = this.indices.get(tableName)
    if (!index) {
      throw new Error(`Table ${tableName} not found`)
    }
    if (index.length == 0) {
      return 0
    } else {
      return index.map((r) => r._order).reduce((n, m) => Math.max(n, m))
    }
  }

  batchInsert(rows: any[]) {
    for (let row of rows) {
      this.insert(row)
    }
  }

  insert(row: any) {
    if (!row._type) {
      throw new Error("attribute '_type' must set")
    }
    if (!row._guid) {
      row._guid = this.#newId()
    }
    if (!row._order) {
      row._order = this.#newOrder(row._type) + 1
    }
    this.rows.set(row._guid, row)
    this.indices.get(row._type)?.push(row)
  }

  #getIndex(name: string) {
    const index = this.indices.get(name)
    if (!index) {
      throw new Error(`Index ${name} not found`)
    }
    return index
  }

  select(tableName: string, filter?: (x: any) => boolean): Row[] {
    const index = this.#getIndex(tableName)
    const rows = index.filter((row) => {
      if (filter) {
        return filter(row)
      } else {
        return true
      }
    })
    return rows
  }

  selectAsTable(
    tableName: string,
    filter?: (x: any) => boolean,
    columns?: string[],
  ): ITable {
    const rows = this.select(tableName, filter)
    let headers: HeaderData[]
    if (columns) {
      const origHeaders = this.tables.get(tableName)!.headers
      headers = columns.map((name) => origHeaders.find((h) => h.name == name)!)
    } else {
      headers = this.tables.get(tableName)!.headers
    }
    return new DataTable(rows, headers)
  }
}
