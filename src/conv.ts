import { loadTsv } from './loadTsv'
import { readFileSync, writeFileSync } from 'fs'

const tsv = readFileSync('public/status_info.tsv').toString()
const data = loadTsv(tsv)

const json = JSON.stringify(data)
writeFileSync('public/status_info.json', json)
