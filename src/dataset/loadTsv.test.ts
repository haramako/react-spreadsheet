import { loadTsv } from './loadTsv'

it('loadTsv', () => {
  const tsv =
    '$KEY id\tname\thp\n' +
    '$TYPE int\tstring\tint\n' +
    '# Comment\n' +
    '1\tslime\t10\n' +
    '2\tbat\t20'

  const expected = [
    { id: 1, name: 'slime', hp: 10 },
    { id: 2, name: 'bat', hp: 20 },
  ]
  expect(loadTsv(tsv)).toEqual(expected)
})
