import { useEffect, useRef, useState } from 'react'
import type { ItemType } from '../../../shared/types'
import { Icon } from './Icons'
import { inferType, normalizeUrl, titleFromPath } from '../utils'
import { TYPE_KEY, useI18n } from '../i18n'

export interface Draft {
  id?: string
  title: string
  desc: string
  path: string
  type: ItemType
  tags: string[]
  createdAt?: number
}

interface Props {
  mode: 'add' | 'edit'
  initial?: Draft
  suggestions: string[]
  onCancel: () => void
  onSubmit: (draft: Draft) => void
}

const TYPE_ORDER: ItemType[] = ['program', 'doc', 'folder', 'link']

export function ItemModal({ mode, initial, suggestions, onCancel, onSubmit }: Props): JSX.Element {
  const { t } = useI18n()
  const [path, setPath] = useState(initial?.path ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [desc, setDesc] = useState(initial?.desc ?? '')
  const [type, setType] = useState<ItemType>(initial?.type ?? 'doc')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')

  const titleTouched = useRef(Boolean(initial?.title))
  const typeTouched = useRef(Boolean(initial?.type))
  const pathRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    pathRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const applyPath = (next: string, isDirectory = false): void => {
    setPath(next)
    if (!titleTouched.current) setTitle(titleFromPath(next))
    if (!typeTouched.current) setType(inferType(next, isDirectory))
  }

  const browse = async (kind: 'file' | 'directory'): Promise<void> => {
    const picked = await window.api.pick(kind)
    if (!picked) return
    applyPath(picked, kind === 'directory')
  }

  const addTag = (raw: string): void => {
    const value = raw.trim()
    if (!value) return
    if (!tags.includes(value)) setTags([...tags, value])
    setTagDraft('')
  }

  const canSave = path.trim().length > 0 && title.trim().length > 0

  const submit = (): void => {
    if (!canSave) return
    onSubmit({
      id: initial?.id,
      title: title.trim(),
      desc: desc.trim(),
      path: type === 'link' ? normalizeUrl(path) : path.trim(),
      type,
      tags,
      createdAt: initial?.createdAt
    })
  }

  return (
    <div className="modal-mask" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-head">
          <h2>{mode === 'add' ? t('modalAddTitle') : t('modalEditTitle')}</h2>
          <p>{t('modalHint')}</p>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>
              {type === 'link' ? t('fieldUrl') : t('fieldPath')} <span className="req">*</span>
            </label>
            <div className="row">
              <input
                ref={pathRef}
                className="input"
                value={path}
                placeholder={type === 'link' ? 'https://example.com' : t('pathPlaceholder')}
                onChange={(event) => applyPath(event.target.value)}
              />
              {type !== 'link' && (
                <>
                  <button className="btn" style={{ height: 32 }} onClick={() => browse('file')}>
                    {t('browseFile')}
                  </button>
                  <button className="btn" style={{ height: 32 }} onClick={() => browse('directory')}>
                    {t('browseFolder')}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="field">
            <label>
              {t('fieldTitle')} <span className="req">*</span>
            </label>
            <input
              className="input"
              value={title}
              onChange={(event) => {
                titleTouched.current = true
                setTitle(event.target.value)
              }}
            />
          </div>

          <div className="field">
            <label>{t('fieldDesc')}</label>
            <textarea
              className="input"
              value={desc}
              placeholder={t('descPlaceholder')}
              onChange={(event) => setDesc(event.target.value)}
            />
          </div>

          <div className="field">
            <label>{t('fieldType')}</label>
            <div className="seg">
              {TYPE_ORDER.map((option) => (
                <button
                  key={option}
                  className={`opt${type === option ? ' on' : ''}`}
                  onClick={() => {
                    typeTouched.current = true
                    setType(option)
                  }}
                >
                  <Icon name={option} size={14} />
                  {t(TYPE_KEY[option])}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>{t('fieldTags')}</label>
            <div className="taginput">
              {tags.map((tag) => (
                <span className="chip" key={tag}>
                  {tag}
                  <button className="x" onClick={() => setTags(tags.filter((item) => item !== tag))}>
                    ✕
                  </button>
                </span>
              ))}
              <input
                list="tag-suggestions"
                value={tagDraft}
                placeholder={t('tagPlaceholder')}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault()
                    addTag(tagDraft)
                  } else if (event.key === 'Backspace' && !tagDraft && tags.length > 0) {
                    setTags(tags.slice(0, -1))
                  }
                }}
                onBlur={() => addTag(tagDraft)}
              />
              <datalist id="tag-suggestions">
                {suggestions.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={!canSave}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
