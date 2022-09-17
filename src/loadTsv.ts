import { tsv2json } from 'tsv-json'

export function loadTsv(src: string) {
  const rows = tsv2json(src)
  let keys: string[] | undefined = undefined
  let types: string[] | undefined = undefined
  const data: any[] = []
  for (let row of rows) {
    if (row[0].startsWith('$KEY')) {
      keys = row
      keys[0] = keys[0].split(' ', 2)[1]
    } else if (row[0].startsWith('$TYPE')) {
      types = row
      types[0] = types[0].split(' ', 2)[1]
    } else if (row[0].startsWith('$') || row[0].startsWith('#')) {
      // DO NOTHING
    } else {
      const obj: any = {}
      row.map((e, i) => {
        switch (types![i]) {
          case 'int':
            obj[keys![i]] = parseInt(e)
            break
          case 'bool':
            obj[keys![i]] = e == '〇' || e == 'true'
            break
          default:
            obj[keys![i]] = e.replace('\\n', '\n')
            break
        }
      })
      data.push(obj)
    }
  }

  return data
}
