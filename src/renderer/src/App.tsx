import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import type { Item, ItemType } from '../../shared/types'
import { Icon, IconDefs } from './components/Icons'
import { RootView } from './components/RootView'
import { ItemGrid } from './components/ItemGrid'
import { ContextMenu } from './components/ContextMenu'
import { ItemModal } from './components/ItemModal'
import type { Draft } from './components/ItemModal'
import { TYPE_KEY, useI18n } from './i18n'
import { compareZh, inferType, matchItem, sortItems, titleFromPath, uid } from './utils'

type View =
  | { kind: 'root' }
  | { kind: 'type'; value: ItemType }
  | { kind: 'tag'; value: string }
  | { kind: 'uncat' }

type SortMode = 'added' | 'name'

type ModalState = { mode: 'add'; initial?: Draft } | { mode: 'edit'; initial: Draft }

const SORT_KEY = 'localcubby.sort'

export default function App(): JSX.Element {
  const { t, lang, toggleLang } = useI18n()
  const [items, setItems] = useState<Item[]>([])
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<View>({ kind: 'root' })
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>(() =>
    localStorage.getItem(SORT_KEY) === 'name' ? 'name' : 'added'
  )
  const [missing, setMissing] = useState<Record<string, boolean>>({})
  const [modal, setModal] = useState<ModalState | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; item: Item } | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    void window.api.readLibrary().then((file) => {
      setItems(file.items)
      setLoaded(true)
    })
  }, [])

  const persist = useCallback(async (next: Item[]): Promise<void> => {
    setItems(next)
    await window.api.saveLibrary(next)
  }, [])

  const refreshMissing = useCallback(async (list: Item[]): Promise<void> => {
    const targets = list.filter((item) => item.type !== 'link').map((item) => item.path)
    if (targets.length === 0) {
      setMissing({})
      return
    }
    const result = await window.api.existsMany(targets)
    const next: Record<string, boolean> = {}
    for (const target of targets) next[target] = result[target] === false
    setMissing(next)
  }, [])

  useEffect(() => {
    if (loaded) void refreshMissing(items)
  }, [loaded, items, refreshMissing])

  useEffect(() => window.api.onWindowFocus(() => void refreshMissing(items)), [items, refreshMissing])

  useEffect(() => {
    const handleDrop = async (event: DragEvent): Promise<void> => {
      setDragging(false)
      const file = event.dataTransfer?.files?.[0]
      if (!file) return
      const path = window.api.getFilePath(file)
      if (!path) return
      const probe = await window.api.probe(path)
      setModal({
        mode: 'add',
        initial: {
          path,
          title: titleFromPath(path),
          type: inferType(path, probe.isDirectory),
          desc: '',
          tags: []
        }
      })
    }

    const onDragOver = (event: DragEvent): void => {
      if (!event.dataTransfer?.types.includes('Files')) return
      event.preventDefault()
      setDragging(true)
    }
    const onDragLeave = (event: DragEvent): void => {
      if (event.relatedTarget === null) setDragging(false)
    }
    const onDrop = (event: DragEvent): void => {
      event.preventDefault()
      void handleDrop(event)
    }

    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  const typeCounts = useMemo(() => {
    const counts: Record<ItemType, number> = { program: 0, doc: 0, folder: 0, link: 0 }
    for (const item of items) counts[item.type] += 1
    return counts
  }, [items])

  const tagList = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => compareZh(a.name, b.name))
  }, [items])

  const allTags = useMemo(() => tagList.map((tag) => tag.name), [tagList])

  const uncategorized = useMemo(() => items.filter((item) => item.tags.length === 0).length, [items])

  const searching = query.trim().length > 0

  const searchResults = useMemo(
    () => (searching ? sortItems(items.filter((item) => matchItem(item, query)), sortMode) : []),
    [searching, items, query, sortMode]
  )

  const groupList = useMemo(() => {
    if (view.kind === 'type') return sortItems(items.filter((item) => item.type === view.value), sortMode)
    if (view.kind === 'tag') return sortItems(items.filter((item) => item.tags.includes(view.value)), sortMode)
    if (view.kind === 'uncat') return sortItems(items.filter((item) => item.tags.length === 0), sortMode)
    return []
  }, [view, items, sortMode])

  const groupTitle =
    view.kind === 'type'
      ? t(TYPE_KEY[view.value])
      : view.kind === 'tag'
        ? view.value
        : view.kind === 'uncat'
          ? t('uncategorized')
          : ''

  const openItem = async (item: Item): Promise<void> => {
    const error = await window.api.openItem(item)
    if (error) window.alert(t('openFailed', { error, path: item.path }))
  }

  const askDelete = async (item: Item): Promise<void> => {
    const confirmed = window.confirm(t('deleteConfirm', { title: item.title }))
    if (!confirmed) return
    await persist(items.filter((entry) => entry.id !== item.id))
  }

  const submitModal = async (draft: Draft): Promise<void> => {
    if (draft.id) {
      await persist(
        items.map((item) =>
          item.id === draft.id
            ? { ...item, title: draft.title, desc: draft.desc, path: draft.path, type: draft.type, tags: draft.tags }
            : item
        )
      )
    } else {
      const item: Item = {
        id: uid(),
        title: draft.title,
        desc: draft.desc,
        path: draft.path,
        type: draft.type,
        tags: draft.tags,
        createdAt: Date.now()
      }
      await persist([...items, item])
    }
    setModal(null)
  }

  const openMenu = (event: MouseEvent, item: Item): void => {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY, item })
  }

  const toggleSort = (): void => {
    const next: SortMode = sortMode === 'added' ? 'name' : 'added'
    setSortMode(next)
    localStorage.setItem(SORT_KEY, next)
  }

  return (
    <div className="app">
      <IconDefs />

      <div className="toolbar">
        <div className="searchbox">
          <Icon name="search" size={16} color="#6b6b6b" />
          <input
            value={query}
            placeholder={t('searchPlaceholder')}
            onChange={(event) => setQuery(event.target.value)}
          />
          {searching && (
            <button className="clear" onClick={() => setQuery('')} title={t('clearSearch')}>
              ✕
            </button>
          )}
        </div>
        <button className="btn" onClick={toggleSort} title={t('sortToggle')}>
          <Icon name="sort" size={15} />
          {sortMode === 'added' ? t('sortAdded') : t('sortName')}
        </button>
        <button
          className="btn"
          data-role="lang"
          onClick={toggleLang}
          title={t('switchLang')}
          style={{ minWidth: 46, justifyContent: 'center' }}
        >
          {lang === 'zh-CN' ? 'EN' : '中'}
        </button>
        <button className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>
          <Icon name="plus" size={15} />
          {t('add')}
        </button>
      </div>

      <div className="content">
        {!loaded ? null : searching ? (
          <>
            <div className="group-head" style={{ marginBottom: 14 }}>
              <h3>{t('searchResults')}</h3>
              <span className="count">{t('searchSummary', { n: searchResults.length })}</span>
            </div>
            {searchResults.length > 0 ? (
              <ItemGrid items={searchResults} missing={missing} onOpen={openItem} onMenu={openMenu} />
            ) : (
              <div className="hint-line">{t('noMatch')}</div>
            )}
          </>
        ) : view.kind === 'root' ? (
          <RootView
            total={items.length}
            typeCounts={typeCounts}
            tags={tagList}
            uncategorized={uncategorized}
            onPickType={(type) => setView({ kind: 'type', value: type })}
            onPickTag={(tag) => setView({ kind: 'tag', value: tag })}
            onPickUncat={() => setView({ kind: 'uncat' })}
            onAdd={() => setModal({ mode: 'add' })}
          />
        ) : (
          <>
            <div className="subhead">
              <button className="back" onClick={() => setView({ kind: 'root' })}>
                <Icon name="back" size={15} />
                {t('back')}
              </button>
              <h2>{groupTitle}</h2>
              <span className="sub-num">{t('itemsCount', { n: groupList.length })}</span>
            </div>
            <ItemGrid items={groupList} missing={missing} onOpen={openItem} onMenu={openMenu} />
          </>
        )}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          item={menu.item}
          onOpen={() => void openItem(menu.item)}
          onReveal={() => void window.api.revealItem(menu.item.path)}
          onEdit={() => setModal({ mode: 'edit', initial: { ...menu.item } })}
          onDelete={() => void askDelete(menu.item)}
          onClose={() => setMenu(null)}
        />
      )}

      {modal && (
        <ItemModal
          mode={modal.mode}
          initial={modal.initial}
          suggestions={allTags}
          onCancel={() => setModal(null)}
          onSubmit={(draft) => void submitModal(draft)}
        />
      )}

      {dragging && <div className="drop-overlay">{t('dropHint')}</div>}
    </div>
  )
}
