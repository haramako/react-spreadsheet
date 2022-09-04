import {
  IntegerValidator,
  NumberValidator,
  StringValidator,
} from './validators'
import { ValueValidatorCollection } from './table'

it('NumberValidator', () => {
  const v = new NumberValidator()
  expect([undefined, 1]).toEqual(v.validate(1))
  expect([undefined, 1]).toEqual(v.validate('1'))
  expect([undefined, 1.5]).toEqual(v.validate('1.5'))
  expect(['not a number', 'number']).toEqual(v.validate('number'))
  expect(['invalid type', [1]]).toEqual(v.validate([1]))
})

it('IntegerValidator', () => {
  const v = new IntegerValidator()
  expect([undefined, 1]).toEqual(v.validate(1))
  expect([undefined, 1]).toEqual(v.validate(1.49))
  expect([undefined, 2]).toEqual(v.validate(1.5))
  expect([undefined, 1]).toEqual(v.validate('1'))
  expect([undefined, 1]).toEqual(v.validate('1.49'))
  expect([undefined, 2]).toEqual(v.validate('1.5'))
  expect(['not a number', 'number']).toEqual(v.validate('number'))
  expect(['invalid type', [1]]).toEqual(v.validate([1]))
})

it('StringValidator', () => {
  const v = new StringValidator()
  expect([undefined, '1']).toEqual(v.validate(1))
  expect([undefined, 'hoge']).toEqual(v.validate('hoge'))
  expect([undefined, '']).toEqual(v.validate(null))
  expect([undefined, '[1]']).toEqual(v.validate([1]))
})

it('ValueValidatorCollection', () => {
  const vc = new ValueValidatorCollection()
  vc.add(new IntegerValidator())
  vc.add(new NumberValidator())
  vc.add(new StringValidator())

  expect([undefined, 1.2]).toEqual(vc.validate('number', 1.2))
  expect([undefined, 1]).toEqual(vc.validate('int', 1.2))
  expect(['validator not match', 1]).toEqual(vc.validate('INVALID', 1))
})
