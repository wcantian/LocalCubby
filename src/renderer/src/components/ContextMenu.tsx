import { useEffect, useRef } from 'react'
import type { Item } from '../../../shared/types'
import { Icon } from './Icons'
import { useI18n } from '../i18n'

interface Props {
  x: number
  y: number
  item: Item
  onOpen: () => void
  onReveal: () => void
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

export function ContextMenu({ x, y, item, onOpen, onReveal, onEdit, onDelete, onClose }: Props): JSX.Element {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: globalThis.MouseEvent): void => {
      if (ref.current && event.target instanceof Node && ref.current.contains(event.target)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onClose)
    window.addEventListener('blur', onClose)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('blur', onClose)
    }
  }, [onClose])

  const left = Math.min(x, window.innerWidth - 184)
  const top = Math.min(y, window.innerHeight - 158)

  const run = (action: () => void) => () => {
    onClose()
    action()
  }

  return (
    <div className="ctx-menu" style={{ left, top }} ref={ref}>
      <button className="mi" onClick={run(onOpen)}>
        <Icon name="open" size={15} color="#5c5c5c" />
        {t('menuOpen')}
      </button>
      {item.type !== 'link' && (
        <button className="mi" onClick={run(onReveal)}>
          <Icon name="reveal" size={15} color="#5c5c5c" />
          {t('menuReveal')}
        </button>
      )}
      <div className="sep" />
      <button className="mi" onClick={run(onEdit)}>
        <Icon name="edit" size={15} color="#5c5c5c" />
        {t('menuEdit')}
      </button>
      <button className="mi danger" onClick={run(onDelete)}>
        <Icon name="trash" size={15} />
        {t('menuDelete')}
      </button>
    </div>
  )
}
