import { useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { formatDuration } from '../lib/time'
import { useCatalog } from '../state/catalog'
import { useSession } from '../state/session'
import { toProject, useDraft } from '../state/project'
import { useScriptInfo } from '../state/scriptInfo'
import { Button, Stat } from './ui'

export const STEPS = [
  { path: '/script', label: 'Script' },
  { path: '/duration', label: 'Duration' },
  { path: '/voice', label: 'Voice' },
  { path: '/captions', label: 'Captions' },
  { path: '/export', label: 'Export' },
] as const

function Logo() {
  return (
    <span className="brand">
      <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
        <rect x="6" y="9" width="12" height="4" rx="2" fill="var(--color-on-primary)" />
        <rect x="6" y="15" width="20" height="4" rx="2" fill="var(--color-on-primary)" />
        <rect x="6" y="21" width="8" height="4" rx="2" fill="var(--color-on-primary)" />
      </svg>
      <span className="brand__name">NarraReel</span>
    </span>
  )
}

export function TopNav() {
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useSession((s) => s.toast)
  const load = useDraft((s) => s.load)

  const openProject = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text())
      const project = await api.validateProject(raw)
      load(project)
      toast('success', `Opened ${file.name}`)
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'That file is not a NarraReel project.')
    }
  }

  const saveProject = () => {
    const project = toProject(useDraft.getState())
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'project.narrareel.json'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('success', 'Project saved. Open it any time to keep editing.')
  }

  return (
    <header className="nav">
      <div className="nav__inner">
        <NavLink to="/script" className="nav__home" aria-label="NarraReel home">
          <Logo />
        </NavLink>
        <nav className="steps" aria-label="Steps">
          {STEPS.map((s, i) => (
            <NavLink key={s.path} to={s.path} className={({ isActive }) => `step-tab ${isActive ? 'step-tab--active' : ''}`}>
              <span className="step-tab__num" aria-hidden="true">
                {i + 1}
              </span>
              {s.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav__actions">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void openProject(f)
              e.target.value = ''
            }}
          />
          <Button variant="text" onClick={() => fileRef.current?.click()}>
            Open project
          </Button>
          <Button variant="text" onClick={saveProject}>
            Save project
          </Button>
        </div>
      </div>
    </header>
  )
}

export function SummaryBar() {
  const info = useScriptInfo()
  const { voice, targetSeconds, format } = useDraft()
  const voices = useCatalog((s) => s.voices)
  const formats = useCatalog((s) => s.formats)
  const voiceName = voices.find((v) => v.engine === voice.engine && v.id === voice.voice_id)?.name ?? voice.voice_id.split('-').at(-1)?.replace('Neural', '')
  const fmt = formats.find((f) => f.id === format)
  const a = info.analysis.data
  return (
    <section className="summary" aria-label="Project summary">
      <Stat value={a ? String(a.word_count) : '0'} label="words" tone="white" />
      <Stat value={a ? formatDuration(a.estimate.total_seconds) : '–'} label="length at 1.0×" />
      <Stat value={targetSeconds ? formatDuration(targetSeconds) : 'Open'} label="target" />
      <Stat value={voiceName ?? '–'} label="voice" tone="white" />
      <Stat value={fmt ? fmt.name.split(' (')[0].split(' / ')[0] : '–'} label="format" tone="white" />
    </section>
  )
}

export function StepNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const script = useDraft((s) => s.script)
  const i = STEPS.findIndex((s) => s.path === pathname)
  if (i < 0) return null
  const prev = STEPS[i - 1]
  const next = STEPS[i + 1]
  const blocked = i === 0 && !script.trim()
  return (
    <div className="step-nav">
      {prev ? (
        <Button variant="secondary" onClick={() => navigate(prev.path)}>
          Back to {prev.label.toLowerCase()}
        </Button>
      ) : (
        <span />
      )}
      {next && (
        <div className="step-nav__next">
          {blocked && <span className="step-nav__error">Add a script first.</span>}
          <Button variant="primary" disabled={blocked} onClick={() => navigate(next.path)}>
            Continue to {next.label.toLowerCase()}
          </Button>
        </div>
      )}
    </div>
  )
}

export function Toasts() {
  const { toasts, dismiss } = useSession()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
          <span>{t.message}</span>
          <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss message">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
