import type { Item, LibraryFile, ProbeResult } from '../../shared/types'

declare global {
  interface Window {
    api: {
      readLibrary: () => Promise<LibraryFile>
      saveLibrary: (items: Item[]) => Promise<void>
      openItem: (item: Item) => Promise<string | null>
      revealItem: (target: string) => Promise<void>
      pick: (kind: 'file' | 'directory') => Promise<string | null>
      probe: (target: string) => Promise<ProbeResult>
      existsMany: (targets: string[]) => Promise<Record<string, boolean>>
      getFilePath: (file: File) => string
      onWindowFocus: (callback: () => void) => () => void
    }
  }
}

export {}
