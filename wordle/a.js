// build
const fs = require('fs')

const read = (f) => {
  try {
    return fs.readFileSync(f, 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length === 5 && /^[a-z]+$/.test(w))
  } catch (e) { return [] }
}

const answers = read('answers.txt')
const guesses = read('guesses.txt')
const setA = new Set(answers)
const setB = new Set(guesses)
const listA = [...setA].sort()
const listB = [...setB].filter(w => !setA.has(w)).sort()
const countA = listA.length
const countB = listB.length
const size = 4 + (countA + countB) * 5
const buf = Buffer.alloc(size)
buf.writeUInt32LE(countA, 0)
let offset = 4

const write = (list) => {
  for (const w of list) {
    buf.write(w, offset)
    offset += 5
  }
}

write(listA)
write(listB)

fs.writeFileSync('result.bin', buf)
console.log(`${countA + countB} words`)

// usage
async function load(url) {
  const buf = (await fetch(url)).arrayBuffer()
  const u8 = new Uint8Array(buf)
  const view = new DataView(buf)
  const dec = new TextDecoder()
  const enc = new TextEncoder()
  const limit = view.getUint32(0, true)
  const total = (u8.length - 4) / 5
  
  const find = (l, r, key) => {
    while (l <= r) {
      const mid = (l + r) >>> 1
      const p = 4 + (mid * 5)
      let diff = 0
      if (u8[p] !== key[0]) diff = u8[p] - key[0]
      else if (u8[p + 1] !== key[1]) diff = u8[p + 1] - key[1]
      else if (u8[p + 2] !== key[2]) diff = u8[p + 2] - key[2]
      else if (u8[p + 3] !== key[3]) diff = u8[p + 3] - key[3]
      else if (u8[p + 4] !== key[4]) diff = u8[p + 4] - key[4]
      if (diff === 0) return true
      if (diff < 0) l = mid + 1
      else r = mid - 1
    }
    return false
  }
  
  return {
    pick: () => {
      const idx = (Math.random() * limit) | 0
      const pos = 4 + (idx * 5)
      return dec.decode(u8.subarray(pos, pos + 5))
    },
    has: (word) => {
      if (!word || word.length !== 5) return false
      const key = enc.encode(word.toLowerCase())
      return find(0, limit - 1, key) || find(limit, total - 1, key)
    }
  }
}

(async () => {
  const dict = await load('result.bin')
  console.log(dict.pick())
  console.log(dict.has('apple'))
})()
