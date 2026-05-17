import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import slides from './slides.json'
import durations from './slide-durations.json'

const PRELOAD_AHEAD = 4
const IDLE_MS = 1800
const DEFAULT_MS = durations._default ?? 3000
const KINA_GREEN = '#89bd01'
const KINA_GREEN_DARK = '#5e8101'
const HEADER_TEXT = 'Chat is the DOS of AI. Kina is the GUI.'

const slideNumber = (filename) => {
  const m = String(filename).match(/(\d+)(?=\.[^.]+$)/)
  return m ? parseInt(m[1], 10) : null
}
const durationFor = (filename) => {
  const n = slideNumber(filename)
  if (n == null) return DEFAULT_MS
  return durations[n] ?? durations[String(n).padStart(2, '0')] ?? DEFAULT_MS
}

export function App() {
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const idleTimer = useRef(null)

  const total = slides.length
  const base = import.meta.env.BASE_URL
  const slideUrl = (i) => `${base}slides/${slides[i]}`

  const home = useCallback(() => setIndex(0), [])
  const end = useCallback(() => setIndex(Math.max(total - 1, 0)), [total])
  const stopAuto = useCallback(() => setAutoAdvance(false), [])
  const reset = useCallback(() => {
    setStarted(false)
    setIndex(0)
    setAutoAdvance(true)
  }, [])
  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) {
        setStarted(false)
        setAutoAdvance(true)
        return 0
      }
      return i + 1
    })
  }, [total])
  const retreat = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) {
        setStarted(false)
        setAutoAdvance(true)
        return 0
      }
      return i - 1
    })
  }, [])

  useEffect(() => {
    if (!started) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') retreat()
      else if (e.key === 'ArrowRight' || e.key === ' ') advance()
      else if (e.key === 'Home') home()
      else if (e.key === 'End') end()
      else return
      stopAuto()
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, retreat, advance, home, end, stopAuto])

  useEffect(() => {
    if (started) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        setStarted(true)
      } else if (e.key === 'ArrowLeft') {
        setIndex(Math.max(total - 1, 0))
        setAutoAdvance(false)
        setStarted(true)
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, total])

  useEffect(() => {
    if (!started || !autoAdvance) return
    const id = setTimeout(() => advance(), durationFor(slides[index]))
    return () => clearTimeout(id)
  }, [started, autoAdvance, index, advance])

  useEffect(() => {
    if (!started) return
    for (let k = 1; k <= PRELOAD_AHEAD; k++) {
      const j = index + k
      if (j >= total) break
      const img = new Image()
      img.src = slideUrl(j)
    }
  }, [started, index, total])

  useEffect(() => {
    if (!started) return
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
  }, [started])

  return (
    <div class="fixed inset-0 flex flex-col bg-white">
      <Header started={started} onReset={reset} />
      <div class="relative flex-1 overflow-hidden">
        {total === 0 ? (
          <EmptyState />
        ) : !started ? (
          <Cover base={base} onStart={() => setStarted(true)} />
        ) : (
          <Viewer
            index={index}
            total={total}
            slideUrl={slideUrl}
            showControls={showControls}
            onAdvance={() => {
              stopAuto()
              advance()
            }}
            onPrev={() => {
              stopAuto()
              retreat()
            }}
            onHome={() => {
              stopAuto()
              home()
            }}
            onNext={() => {
              stopAuto()
              advance()
            }}
          />
        )}
      </div>
      <Footer started={started} />
    </div>
  )
}

function Footer({ started }) {
  return (
    <footer class="flex h-[40px] shrink-0 items-center gap-3 pl-6 pr-6 text-sm text-neutral-300">
      <span>© 2026 kina.bot</span>
      {!started && (
        <span>
          Kina (Evechinus chloroticus) are the most common species of sea
          urchin found in shallow coastal waters surrounding Aotearoa and its
          offshore islands.
        </span>
      )}
    </footer>
  )
}

function Header({ started, onReset }) {
  const base = import.meta.env.BASE_URL
  return (
    <header class="relative flex h-[60px] shrink-0 items-center bg-black text-white">
      <button
        type="button"
        onClick={onReset}
        aria-label="Back to cover"
        class="ml-6 cursor-pointer"
      >
        <img
          src={`${base}icons/kina-wordmark.svg`}
          alt="Kina"
          class="h-10 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
          draggable={false}
        />
      </button>
      {!started && (
        <div class="pointer-events-none absolute inset-0 flex items-center justify-end pr-6">
          <span class="text-lg font-medium tracking-tight">{HEADER_TEXT}</span>
        </div>
      )}
    </header>
  )
}

function EmptyState() {
  return (
    <div class="grid h-full place-items-center text-neutral-400">
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

function Cover({ base, onStart }) {
  return (
    <div class="flex h-full w-full flex-col overflow-y-auto">
      <img
        src={`${base}kina-pitch-cover.png`}
        alt="Kina cover"
        class="block w-full"
        draggable={false}
      />
      <div class="flex justify-center px-[5%] pt-10 pb-[250px]">
        <div class="w-full max-w-[1500px]">
          <p class="mb-8 text-[20px] font-bold leading-snug text-black">
            Agents don't need better prompts.
            <br />
            They need a better place.
          </p>
          <div
            class="grid items-start gap-x-10"
            style={{ gridTemplateColumns: 'auto repeat(3, minmax(0, 1fr))' }}
          >
            <button
              type="button"
              onClick={onStart}
              class="inline-flex h-[60px] shrink-0 items-center gap-2 rounded-[8px] px-5 text-[18px] font-bold text-white transition hover:brightness-95"
              style={{ background: KINA_GREEN }}
            >
              <span>Learn more</span>
              <CarbonChevronRight />
            </button>
            <p
              class="text-[17px] leading-[1.55]"
              style={{ color: KINA_GREEN_DARK }}
            >
              Kina is a shared workspace where you and your AI agents work
              side by side.
            </p>
            <p
              class="text-[17px] leading-[1.55]"
              style={{ color: KINA_GREEN_DARK }}
            >
              Everything is visible and interactive on a spatial canvas.
              Everyone sees the same things, can interact with them, watch each
              other work, and write code together.
            </p>
            <p
              class="text-[17px] leading-[1.55]"
              style={{ color: KINA_GREEN_DARK }}
            >
              Work doesn't disappear into Markdown files or chat transcripts.
              It lives as typed objects like a contact, a note, a todo, or a
              map location. You compose them into activities, the replacement
              for apps. Each activity is a living arrangement of interconnected
              objects and agents that grows with you. Share an activity and a
              collaborator lands inside it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Viewer({
  index,
  total,
  slideUrl,
  showControls,
  onAdvance,
  onPrev,
  onHome,
  onNext,
}) {
  return (
    <div
      class="grid h-full w-full cursor-pointer place-items-center overflow-hidden bg-white select-none"
      onClick={onAdvance}
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
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
          >
            <ChevronLeft />
          </CtlButton>
          <CtlButton
            label="First slide"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation()
              onHome()
            }}
          >
            <HomeIcon />
          </CtlButton>
          <CtlButton
            label="Next slide"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
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

function CarbonChevronRight() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 16L12 26l-1.4-1.4 8.6-8.6-8.6-8.6L12 6z" />
    </svg>
  )
}
