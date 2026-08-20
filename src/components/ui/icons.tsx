/**
 * Inline icons, stroke-based and sized by the caller. Small enough that a
 * dependency would cost more than it saves.
 */
type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? 'size-4'}
    >
      {children}
    </svg>
  )
}

export function FlameIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3c.6 3 2.4 4 3.6 5.4A6.6 6.6 0 0 1 17.4 13a5.4 5.4 0 0 1-10.8 0c0-1.5.6-2.7 1.5-3.6 0 1.2.7 2 1.7 2 0-2.7.6-5.6 2.2-8.4Z" />
    </Svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </Svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  )
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </Svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4.5v15l12-7.5z" fill="currentColor" strokeWidth={1} />
    </Svg>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 4.5v15M15 4.5v15" strokeWidth={2} />
    </Svg>
  )
}

/** A speaker with sound coming out of it, for "read this to me". */
export function SpeakerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9.5v5h3l4.5 3.5v-12L7 9.5z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
    </Svg>
  )
}

/** The same speaker with the waves struck through, for audio that is playing. */
export function SpeakerOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9.5v5h3l4.5 3.5v-12L7 9.5z" />
      <path d="M15.5 10.5l4 3M19.5 10.5l-4 3" />
    </Svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 13 4 4L19 7" />
    </Svg>
  )
}

export function LightbulbIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.4.3.6.8.6 1.2h6c0-.4.2-.9.6-1.2A6 6 0 0 0 12 3Z" />
    </Svg>
  )
}
