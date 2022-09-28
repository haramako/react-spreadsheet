export function iota<T>(len: number, callback: (n: number) => T) {
  return [...Array(len)].map((_, i) => callback(i))
}
