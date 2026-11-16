import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Item, ProbeResult } from '../shared/types'
import { readLibrary, readWindowState, writeLibrary, writeWindowState } from './store'

/** 便携数据目录：打包后为 exe 同级 data/，开发时为项目根 data/ */
const dataDir = app.isPackaged ? join(dirname(app.getPath('exe')), 'data') : join(process.cwd(), 'data')

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const state = readWindowState(dataDir)

  mainWindow = new BrowserWindow({
    width: state?.width ?? 1000,
    height: state?.height ?? 700,
    x: state?.x,
    y: state?.y,
    minWidth: 720,
    minHeight: 480,
    title: 'LocalCubby',
    backgroundColor: '#f3f3f3',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('window:focus')
  })

  mainWindow.on('close', () => {
    if (!mainWindow) return
    const bounds = mainWindow.getBounds()
    writeWindowState(dataDir, {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y
    })
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function probe(target: string): ProbeResult {
  try {
    const stat = statSync(target)
    return { exists: true, isDirectory: stat.isDirectory() }
  } catch {
    return { exists: false, isDirectory: false }
  }
}

function registerIpc(): void {
  ipcMain.handle('library:read', () => readLibrary(dataDir))

  ipcMain.handle('library:write', (_event, items: Item[]) => {
    writeLibrary(dataDir, items)
  })

  ipcMain.handle('item:open', async (_event, item: Item): Promise<string | null> => {
    if (item.type === 'link') {
      try {
        await shell.openExternal(item.path)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : String(err)
      }
    }
    const errorMessage = await shell.openPath(item.path)
    return errorMessage || null
  })

  ipcMain.handle('item:reveal', (_event, target: string) => {
    shell.showItemInFolder(target)
  })

  ipcMain.handle('dialog:pick', async (_event, kind: 'file' | 'directory'): Promise<string | null> => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: kind === 'directory' ? ['openDirectory'] : ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('path:probe', (_event, target: string) => probe(target))

  /** 批量检查本地路径是否存在，返回 { 路径: 是否存在 } */
  ipcMain.handle('path:exists-many', (_event, targets: string[]): Record<string, boolean> => {
    const result: Record<string, boolean> = {}
    for (const target of targets) {
      result[target] = existsSync(target)
    }
    return result
  })
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
