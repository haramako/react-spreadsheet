import express from 'express'
import bodyParser from 'body-parser'
import * as path from 'path'
import { readFileSync, writeFileSync } from 'fs'

const app = express()
app.use(express.static('build'))

app.get('/api/files/:name', function (req, res) {
  const name = req.params.name
  const json = readFileSync(path.resolve("var/" + name))
  res.send(json)
})

app.put('/api/files/:name', bodyParser.text({ type: '*/*' }), function (req, res) {
  const name = req.params.name
  writeFileSync(path.resolve("var/" + name), req.body)
  res.send('OK')
})

app.listen(process.env.PORT || 8080)
