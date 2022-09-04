import { iota } from './util'

//=================================================
// CellData
//=================================================
export class CellData {
    #value: string
    #version: number
    callback: () => void

    constructor(value: string) {
        this.#value = value
        this.#version = 0
        this.callback = () => {}
    }

    get value() {
        return this.#value
    }

    set value(v: string) {
        this.#value = v
        this.#version++
        this.callback()
    }

    get version() {
        return this.#version
    }

    onChange(callback: () => void) {
        this.callback = callback
    }
}
type TypeKind = 'number' | 'string' | 'boolean' | 'object'

export class CellType {
    type: TypeKind

    constructor(type: TypeKind) {
        this.type = type
    }
}

export class HeaderData {
    name: string
    type: CellType
    unique: boolean
    validator?: (value: any) => boolean
    constructor(name: string, type: CellType) {
        this.name = name
        this.type = type
        this.unique = false
    }
}

//=================================================
// DataSet
//=================================================
export class DataSet {
    colNum: number
    rowNum: number
    data: CellData[][]
    headers: HeaderData[]
    constructor(rowNum: number, colNum: number) {
        this.rowNum = rowNum
        this.colNum = colNum
        this.data = iota(rowNum, (i) =>
            iota(colNum, (j) => new CellData('' + j)),
        )
        this.headers = iota(
            colNum,
            (i) =>
                new HeaderData(
                    String.fromCharCode('A'.charCodeAt(0) + i),
                    new CellType('string'),
                ),
        )
    }

    getHeader(col: number) {
        return this.headers[col]
    }

    get(row: number, col: number) {
        return this.data[row][col]
    }
}
