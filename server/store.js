import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json')

const EMPTY_DB = { guests: [], archive: [], housekeeping: {} }

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Basit yazma kilidi: eşzamanlı isteklerde db.json'ın üzerine yazılmasını önler.
let writeChain = Promise.resolve()

export async function readDb() {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      guests: Array.isArray(parsed.guests) ? parsed.guests : [],
      archive: Array.isArray(parsed.archive) ? parsed.archive : [],
      housekeeping: isPlainObject(parsed.housekeeping) ? parsed.housekeeping : {},
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeDb(EMPTY_DB)
      return { ...EMPTY_DB }
    }
    throw err
  }
}

export async function writeDb(data) {
  writeChain = writeChain.then(async () => {
    const tmpPath = `${DB_PATH}.tmp`
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
    await fs.rename(tmpPath, DB_PATH)
  })
  return writeChain
}

/**
 * Okuma + değişiklik + yazma işlemini atomik hale getirir.
 * mutator(db) senkron veya async çalışabilir ve db'yi doğrudan mutasyona uğratır.
 */
export async function updateDb(mutator) {
  writeChain = writeChain.then(async () => {
    const raw = await fs.readFile(DB_PATH, 'utf-8').catch((err) => {
      if (err.code === 'ENOENT') return JSON.stringify(EMPTY_DB)
      throw err
    })
    const db = JSON.parse(raw)
    if (!Array.isArray(db.guests)) db.guests = []
    if (!Array.isArray(db.archive)) db.archive = []
    if (!isPlainObject(db.housekeeping)) db.housekeeping = {}

    const result = await mutator(db)

    const tmpPath = `${DB_PATH}.tmp`
    await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), 'utf-8')
    await fs.rename(tmpPath, DB_PATH)

    return result
  })
  return writeChain
}
