// 조선해양
const marine = {
  safety001: 10,
  safety002: 10,
  safety003: 9,
  safety004: 9,
  safety005: 8,
  safety006: 10,
  safety007: 9
}
// 특수선
const special = {
  safety001: 6,
  safety002: 7,
  safety003: 8,
  safety004: 2,
  safety005: 9,
  safety006: 10,
  safety007: 7
}
// 엔진기계
const engine = {
  safety001: 2,
  safety002: 10,
  safety003: 8,
  safety004: 6,
  safety005: 8,
  safety006: 10,
  safety007: 10
}
const total = [marine, special, engine].reduce((acc, obj) => {
  for (const key in obj) {
    acc[key] = (acc[key] || 0) + obj[key]
  }
  return acc
}, {})

export {
  marine, special, engine, total
}