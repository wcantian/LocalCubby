import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Item, LibraryFile, WindowState } from '../shared/types'

const LIBRARY_FILE = 'library.json'
const WINDOW_FILE = 'window-state.json'

/** 原子写入：先写 .tmp 再 rename，避免断电/崩溃写坏文件 */
function writeJsonAtomic(file: string, data: unknown): void {
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, file)
}

/** 读取损坏时把坏文件改名留档，返回 null 让调用方走默认值 */
function readJsonSafe<T>(file: string): T | null {
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch {
    const backup = `${file}.corrupt-${Date.now()}`
    try {
      renameSync(file, backup)
      console.error(`[store] 文件损坏，已备份为 ${backup}`)
    } catch (err) {
      console.error('[store] 文件损坏且备份失败', err)
    }
    return null
  }
}

export function readLibrary(dataDir: string): LibraryFile {
  const file = join(dataDir, LIBRARY_FILE)
  const data = readJsonSafe<LibraryFile>(file)
  if (!data || !Array.isArray(data.items)) return { version: 1, items: [] }
  return { version: data.version ?? 1, items: data.items }
}

export function writeLibrary(dataDir: string, items: Item[]): void {
  mkdirSync(dataDir, { recursive: true })
  const payload: LibraryFile = { version: 1, items }
  writeJsonAtomic(join(dataDir, LIBRARY_FILE), payload)
}

export function readWindowState(dataDir: string): WindowState | null {
  return readJsonSafe<WindowState>(join(dataDir, WINDOW_FILE))
}

export function writeWindowState(dataDir: string, state: WindowState): void {
  try {
    mkdirSync(dataDir, { recursive: true })
    writeJsonAtomic(join(dataDir, WINDOW_FILE), state)
  } catch (err) {
    console.error('[store] 保存窗口状态失败', err)
  }
}
