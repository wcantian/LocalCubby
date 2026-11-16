import type { MouseEvent } from 'react'
import type { Item } from '../../../shared/types'
import { Icon } from './Icons'
import { typeColor } from '../utils'
import { useI18n } from '../i18n'

interface Props {
  items: Item[]
  missing: Record<string, boolean>
  onOpen: (item: Item) => void
  onMenu: (event: MouseEvent, item: Item) => void
}

export function ItemGrid({ items, missing, onOpen, onMenu }: Props): JSX.Element {
  const { t } = useI18n()
  const missingLabel = t('missingPath')

  return (
    <div className="item-grid">
      {items.map((item) => {
        const isMissing = missing[item.path] === true
        const tip = `${item.title}\n${item.path}${isMissing ? `\n${missingLabel}` : ''}`
        return (
          <div
            key={item.id}
            className={`item${isMissing ? ' missing' : ''}`}
            title={tip}
            onDoubleClick={() => onOpen(item)}
            onContextMenu={(event) => onMenu(event, item)}
          >
            <div className="icon">
              <Icon name={item.type} size={64} color={isMissing ? '#7d7d7d' : typeColor(item.type)} />
            </div>
            <div className="title">{item.title}</div>
            <div className="desc">{item.desc || '\u00a0'}</div>
            {isMissing && <div className="badge-missing">{missingLabel}</div>}
          </div>
        )
      })}
    </div>
  )
}
