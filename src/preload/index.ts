import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { Item, LibraryFile, ProbeResult } from '../shared/types'

const api = {
  readLibrary: (): Promise<LibraryFile> => ipcRenderer.invoke('library:read'),
  saveLibrary: (items: Item[]): Promise<void> => ipcRenderer.invoke('library:write', items),
  openItem: (item: Item): Promise<string | null> => ipcRenderer.invoke('item:open', item),
  revealItem: (target: string): Promise<void> => ipcRenderer.invoke('item:reveal', target),
  pick: (kind: 'file' | 'directory'): Promise<string | null> => ipcRenderer.invoke('dialog:pick', kind),
  probe: (target: string): Promise<ProbeResult> => ipcRenderer.invoke('path:probe', target),
  existsMany: (targets: string[]): Promise<Record<string, boolean>> =>
    ipcRenderer.invoke('path:exists-many', targets),
  /** 拖拽进来的 File 对象取真实磁盘路径（Electron 32+ 移除了 File.path） */
  getFilePath: (file: File): string => webUtils.getPathForFile(file),
  onWindowFocus: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('window:focus', handler)
    return () => ipcRenderer.removeListener('window:focus', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
