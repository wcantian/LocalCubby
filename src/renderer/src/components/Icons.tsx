import type { ItemType } from '../../../shared/types'

export type IconName =
  | ItemType
  | 'search'
  | 'sort'
  | 'plus'
  | 'back'
  | 'open'
  | 'reveal'
  | 'edit'
  | 'trash'
  | 'box'

type Props = {
  name: IconName
  size?: number
  color?: string
}

/** 一次性渲染的 SVG symbol 定义 */
export function IconDefs(): JSX.Element {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="i-program" viewBox="0 0 24 24">
          <rect x="2.5" y="4" width="19" height="16" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M2.5 8.6h19" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="5.6" cy="6.3" r="0.85" fill="currentColor" />
          <circle cx="8.3" cy="6.3" r="0.85" fill="currentColor" />
          <path
            d="M6 12.4l2.2 2.2 3.2-3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.6 15.4h4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>

        <symbol id="i-doc" viewBox="0 0 24 24">
          <path
            d="M14.2 2.6H6.4A2 2 0 0 0 4.4 4.6v14.8a2 2 0 0 0 2 2h11.2a2 2 0 0 0 2-2V7.8z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M14 2.7v5.2h5.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M7.8 13h8.4M7.8 16.4h5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>

        <symbol id="i-folder" viewBox="0 0 24 24">
          <path
            d="M3 6.6a2 2 0 0 1 2-2h3.8l2 2.4H19a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M3 10.2h18" stroke="currentColor" strokeWidth="1.7" />
        </symbol>

        <symbol id="i-link" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M2.8 12h18.4" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 2.8c2.6 2.6 3.9 5.8 3.9 9.2s-1.3 6.6-3.9 9.2c-2.6-2.6-3.9-5.8-3.9-9.2S9.4 5.4 12 2.8z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </symbol>

        <symbol id="i-search" viewBox="0 0 24 24">
          <circle cx="10.6" cy="10.6" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15.4 15.4L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>

        <symbol id="i-sort" viewBox="0 0 24 24">
          <path
            d="M7 4v16M7 20l-3-3M7 20l3-3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M17 20V4M17 4l-3 3M17 4l3 3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>

        <symbol id="i-plus" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </symbol>

        <symbol id="i-back" viewBox="0 0 24 24">
          <path
            d="M14.5 5.5L8 12l6.5 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        <symbol id="i-open" viewBox="0 0 24 24">
          <path
            d="M14 4h6v6M20 4l-8.5 8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 14.5v4.2a2 2 0 0 1-2 2H5.8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </symbol>

        <symbol id="i-reveal" viewBox="0 0 24 24">
          <path
            d="M3 7.4a2 2 0 0 1 2-2h3.6l2 2.3H19a2 2 0 0 1 2 2v7.9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </symbol>

        <symbol id="i-edit" viewBox="0 0 24 24">
          <path d="M4 20h4l10-10-4-4L4 16z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M13.5 5.5l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>

        <symbol id="i-trash" viewBox="0 0 24 24">
          <path
            d="M4.5 7h15M9.5 4.5h5M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6L17.5 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        <symbol id="i-box" viewBox="0 0 24 24">
          <path
            d="M3.5 8.2L12 3.6l8.5 4.6v7.6L12 20.4l-8.5-4.6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M3.8 8.4L12 12.9l8.2-4.5M12 12.9v7.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </symbol>
      </defs>
    </svg>
  )
}

export function Icon({ name, size = 16, color }: Props): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      style={color ? { color, flex: '0 0 auto' } : { flex: '0 0 auto' }}
      aria-hidden="true"
    >
      <use href={`#i-${name}`} />
    </svg>
  )
}
