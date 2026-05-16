import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import slides from './slides.json'
import durations from './slide-durations.json'

const PRELOAD_AHEAD = 4
const IDLE_MS = 1800
const DEFAULT_MS = durations._default ?? 3000

const slideNumber = (filename) => {
  const m = String(filename).match(/(\d+)(?=\.[^.]+$)/)
  return m ? parseInt(m[1], 10) : null
}
const durationFor = (filename) => {
  const n = slideNumber(filename)
  if (n == null) return DEFAULT_MS
  return (
    durations[n] ?? durations[String(n).padStart(2, '0')] ?? DEFAULT_MS
  )
}

export function App() {
  const [index, setIndex] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const idleTimer = useRef(null)

  const total = slides.length
  const base = import.meta.env.BASE_URL
  const slideUrl = (i) => `${base}slides/${slides[i]}`

  const go = useCallback(
    (delta) => setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1)),
    [total],
  )
  const home = useCallback(() => setIndex(0), [])
  const end = useCallback(() => setIndex(Math.max(total - 1, 0)), [total])
  const stopAuto = useCallback(() => setAutoAdvance(false), [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight' || e.key === ' ') go(1)
      else if (e.key === 'Home') home()
      else if (e.key === 'End') end()
      else return
      stopAuto()
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, home, end, stopAuto])

  useEffect(() => {
    if (!autoAdvance) return
    const id = setTimeout(() => go(1), durationFor(slides[index]))
    return () => clearTimeout(id)
  }, [autoAdvance, index, go])

  useEffect(() => {
    for (let k = 1; k <= PRELOAD_AHEAD; k++) {
      const j = index + k
      if (j >= total) break
      const img = new Image()
      img.src = slideUrl(j)
    }
  }, [index, total])

  useEffect(() => {
    const bump = () => {
      setShowControls(true)
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setShowControls(false), IDLE_MS)
    }
    bump()
    window.addEventListener('mousemove', bump)
    return () => {
      window.removeEventListener('mousemove', bump)
      clearTimeout(idleTimer.current)
    }
  }, [])

  if (total === 0) {
    return (
      <div class="fixed inset-0 grid place-items-center bg-white text-neutral-400">
        <p>
          No slides yet. Drop PNG files into{' '}
          <code class="rounded bg-neutral-100 px-1 py-0.5 text-neutral-600">
            public/slides/
          </code>
          .
        </p>
      </div>
    )
  }

  return (
    <div
      class="fixed inset-0 grid cursor-pointer place-items-center select-none overflow-hidden bg-white"
      onClick={() => {
        stopAuto()
        go(1)
      }}
    >
      <img
        src={slideUrl(index)}
        alt={`Slide ${index + 1} of ${total}`}
        class="max-h-full max-w-full object-contain"
        draggable={false}
      />

      <div
        class={`pointer-events-none absolute inset-x-0 bottom-6 flex justify-center transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div class="pointer-events-auto flex items-center gap-1 rounded-full bg-white/85 px-2 py-1.5 shadow-md ring-1 ring-neutral-200 backdrop-blur">
          <CtlButton
            label="Previous slide"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation()
              stopAuto()
              go(-1)
            }}
          >
            <ChevronLeft />
          </CtlButton>
          <CtlButton
            label="First slide"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation()
              stopAuto()
              home()
            }}
          >
            <HomeIcon />
          </CtlButton>
          <CtlButton
            label="Next slide"
            disabled={index === total - 1}
            onClick={(e) => {
              e.stopPropagation()
              stopAuto()
              go(1)
            }}
          >
            <ChevronRight />
          </CtlButton>
        </div>
      </div>

      <div
        class={`pointer-events-none absolute right-6 bottom-6 rounded-full bg-white/85 px-3 py-1.5 text-sm tabular-nums text-neutral-600 shadow-sm ring-1 ring-neutral-200 backdrop-blur transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {index + 1} / {total}
      </div>
    </div>
  )
}

function CtlButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      class="grid h-9 w-9 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}
