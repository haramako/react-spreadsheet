export class IntegerValidator {
  isMatch(v: string): boolean {
    return v === 'int'
  }

  validate(v: any): [string | undefined, any] {
    if (typeof v === 'number') {
      return [undefined, Math.round(v)]
    } else if (typeof v === 'string') {
      const n = Number.parseFloat(v)
      if (Number.isNaN(n)) {
        return ['not a number', v]
      } else {
        return [undefined, Math.round(n)]
      }
    } else {
      return ['invalid type', v]
    }
  }
}

export class NumberValidator {
  isMatch(v: string): boolean {
    return v === 'number'
  }

  validate(v: any): [string | undefined, any] {
    if (typeof v === 'number') {
      return [undefined, v]
    } else if (typeof v === 'string') {
      const n = Number.parseFloat(v)
      if (Number.isNaN(n)) {
        return ['not a number', v]
      } else {
        return [undefined, n]
      }
    } else {
      return ['invalid type', v]
    }
  }
}

export class StringValidator {
  isMatch(v: string): boolean {
    return v === 'string'
  }

  validate(v: any): [string | undefined, any] {
    if (v === undefined || v === null) {
      return [undefined, '']
    } else if (typeof v === 'string') {
      return [undefined, v]
    } else {
      return [undefined, JSON.stringify(v)]
    }
  }
}

export class BooleanValidator {
  isMatch(v: string): boolean {
    return v === 'boolean'
  }

  validate(v: any): [string | undefined, any] {
    if (v === undefined || v === null) {
      return [undefined, false]
    } else if (typeof v === 'boolean') {
      return [undefined, v]
    } else if (typeof v === 'string') {
      if (v.toLowerCase() === 'true') {
        return [undefined, true]
      } else if (v.toLowerCase() === 'false') {
        return [undefined, false]
      } else {
        return ['not a boolean', v]
      }
    } else {
      return ['not a boolean', v]
    }
  }
}
