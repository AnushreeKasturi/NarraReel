import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, jobFileUrl, watchJob } from '../api/client'
import { Banner, Badge, Button, Card, CodeWindow, ProgressBar, Stat, Tabs } from '../components/ui'
import { formatDuration, slugFirstWords } from '../lib/time'
import { useCatalog } from '../state/catalog'
import { toProject, useDraft, voiceKey } from '../state/project'
import type { Draft } from '../state/project'
import { useSession } from '../state/session'

const STAGES: { id: string; label: string }[] = [
  { id: 'prepare', label: 'Preparing' },
  { id: 'voice', label: 'Generating the voice' },
  { id: 'timing', label: 'Timing the words' },
  { id: 'captions', label: 'Building captions' },
  { id: 'render', label: 'Rendering the video' },
]

const DOWNLOADS: { key: string; label: string; note: string }[] = [
  { key: 'video', label: 'Video', note: 'The finished video' },
  { key: 'audio_mp3', label: 'Voiceover (MP3)', note: 'Small and universal' },
  { key: 'audio_wav', label: 'Voiceover (WAV)', note: 'Uncompressed, for editors' },
  { key: 'captions_srt', label: 'Subtitles (SRT)', note: 'YouTube and most editors' },
  { key: 'captions_ass', label: 'Styled subtitles (ASS)', note: 'Keeps your caption styling' },
  { key: 'words_json', label: 'Word timings (JSON)', note: 'Start and end of every word' },
  { key: 'project', label: 'Project file', note: 'Open it later to keep editing' },
]

function cliCommand(d: Draft): string {
  const parts = ['narrareel make script.txt', `--voice ${d.voice.engine}:${d.voice.voice_id}`]
  if (d.targetSeconds) parts.push(`--target ${Math.round(d.targetSeconds)}s`)
  else if (d.speed !== 1) parts.push(`--speed ${d.speed}`)
  if (d.energy !== 0.5) parts.push(`--energy ${d.energy}`)
  parts.push(`--format ${d.format}`, `--style ${d.captions.preset}`)
  if (d.captions.font) parts.push(`--font ${d.captions.font}`)
  if (d.background.type === 'transparent') parts.push('--background transparent')
  else if (d.background.type === 'solid' && d.background.color.toLowerCase() !== '#101010') parts.push(`--background "${d.background.color}"`)
  parts.push(`-o ${slugFirstWords(d.script)}.${d.export.video}`)
  return parts.join(' \\\n  ')
}

export function ExportStep() {
  const draft = useDraft()
  const { setExport } = draft
  const formats = useCatalog((s) => s.formats)
  const health = useCatalog((s) => s.health)
  const { job, jobVoiceKey, progress, setJob, setProgress, toast } = useSession()
  const navigate = useNavigate()
  const [running, setRunning] = useState<string | null>(null)
  const stop = useRef<(() => void) | null>(null)
  const fmt = formats.find((f) => f.id === draft.format)
  const isAudio = fmt ? !fmt.width : false
  const transparent = draft.background.type === 'transparent'
  const key = voiceKey(draft)
  const canReuse = !!job && job.status === 'done' && jobVoiceKey === key && !!job.result?.files.words_json
  useEffect(() => () => stop.current?.(), [])

  const run = async () => {
    const project = toProject(draft)
    setProgress({ stage: 'prepare', fraction: 0, message: 'Starting' })
    try {
      const created = canReuse && job ? await api.rerender(job.id, project) : await api.createJob(project)
      const id = created.job_id
      setRunning(id)
      stop.current = watchJob(
        id,
        (e) => setProgress({ stage: e.stage, fraction: e.fraction, message: e.message }),
        async () => {
          const status = await api.job(id)
          setRunning(null)
          setProgress(null)
          if (status.status === 'done') {
            setJob(status, key)
            toast('success', 'Your video is ready.')
          } else if (status.status === 'cancelled') {
            toast('info', 'Cancelled.')
          } else {
            setJob(null, null)
            toast('error', status.error ?? 'The video could not be made.')
          }
        },
        () => {
          setRunning(null)
          setProgress(null)
          toast('error', 'Lost connection to the server. Check that `narrareel serve` is still running.')
        },
      )
    } catch (e) {
      setRunning(null)
      setProgress(null)
      toast('error', e instanceof Error ? e.message : 'Could not start the video.')
    }
  }

  const cancel = async () => {
    if (running) await api.cancelJob(running).catch(() => {})
  }

  const missingScript = !draft.script.trim()
  const busy = running !== null
  const stageIndex = progress ? Math.max(0, STAGES.findIndex((s) => s.id === progress.stage)) : 0
  const result = job?.status === 'done' ? job.result : null
  const files = result?.files ?? {}

  return (
    <div className="stack stack--lg">
      <header className="step-head">
        <h1 className="display">Make your video</h1>
        <p className="lede">Check the choices below, then generate. Restyling the captions later reuses the voiceover.</p>
      </header>

      {health && (!health.ffmpeg || (!health.libass && !isAudio)) && (
        <Banner tone="error" title={health.ffmpeg ? 'ffmpeg can’t draw captions' : 'ffmpeg is missing'}>
          Install ffmpeg with libass: <code>winget install Gyan.FFmpeg</code> on Windows, <code>brew install ffmpeg</code>{' '}
          on macOS, <code>sudo apt install ffmpeg</code> on Linux. Then restart NarraReel.
        </Banner>
      )}

      <Card className="stack" as="section">
        <h2 className="title">Summary</h2>
        <dl className="summary-list">
          <div><dt>Script</dt><dd>{draft.script.trim() ? `${draft.script.trim().split(/\s+/).length} words` : 'Empty'}</dd></div>
          <div><dt>Length</dt><dd>{draft.targetSeconds ? `Exactly ${formatDuration(draft.targetSeconds)}` : `Natural, ${draft.speed.toFixed(2)}× speed`}</dd></div>
          <div><dt>Voice</dt><dd>{draft.voice.voice_id} ({draft.voice.engine})</dd></div>
          <div><dt>Format</dt><dd>{fmt?.name ?? draft.format}</dd></div>
          <div><dt>Captions</dt><dd>{draft.captions.preset}{draft.captions.font ? `, ${draft.captions.font}` : ''}</dd></div>
          <div><dt>Background</dt><dd>{draft.background.type === 'solid' ? `Colour ${draft.background.color}` : draft.background.type}</dd></div>
        </dl>
        {!isAudio && (
          <div className="grid-2">
            {transparent && (
              <div className="field">
                <span className="field__label">File type</span>
                <Tabs
                  label="Overlay file type"
                  value={draft.export.video === 'mov' ? 'mov' : 'webm'}
                  onChange={(v) => setExport({ video: v })}
                  items={[
                    { id: 'webm', label: 'WebM (small)', hint: 'VP9 with transparency' },
                    { id: 'mov', label: 'MOV ProRes (editors)', hint: 'Large files, widest editor support' },
                  ]}
                />
                {draft.export.video === 'mov' && <p className="field__hint">ProRes files are big: roughly 20 MB per 10 seconds.</p>}
              </div>
            )}
            <div className="field">
              <span className="field__label">Render speed</span>
              <Tabs
                label="Render quality"
                value={draft.export.quality}
                onChange={(v) => setExport({ quality: v })}
                items={[
                  { id: 'fast', label: 'Fast' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'high', label: 'High quality' },
                ]}
              />
            </div>
          </div>
        )}
      </Card>

      <Card yellow className="cta-band" as="section">
        {busy && progress ? (
          <div className="stack">
            <h2 className="display display--sm">{STAGES[stageIndex]?.label ?? 'Working'}…</h2>
            <ProgressBar fraction={progress.fraction} label="Video progress" />
            <p className="cta-band__line">{progress.message}</p>
            <ol className="stages" aria-label="Stages">
              {STAGES.map((s, i) => (
                <li key={s.id} className={i < stageIndex ? 'stage stage--done' : i === stageIndex ? 'stage stage--now' : 'stage'}>
                  {s.label}
                </li>
              ))}
            </ol>
            <div>
              <Button variant="dark-on-yellow" onClick={cancel}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="cta-band__row">
            <div>
              <h2 className="display display--sm">{result ? 'Make it again' : 'Ready when you are'}</h2>
              <p className="cta-band__line">
                {canReuse
                  ? 'Your voiceover is kept. Only the captions and video are rebuilt.'
                  : isAudio
                    ? 'You get the voiceover, subtitles and word timings.'
                    : 'You get the video, the voiceover, subtitles and word timings.'}
              </p>
              {missingScript && <p className="cta-band__line cta-band__line--error">Add a script first.</p>}
            </div>
            <Button variant="dark-on-yellow" className="btn--lg" disabled={missingScript || (health ? !health.ffmpeg : false)} onClick={run}>
              {canReuse ? 'Re-render video' : isAudio ? 'Generate audio' : 'Generate video'}
            </Button>
          </div>
        )}
      </Card>

      {result && job && (
        <section className="stack stack--lg" aria-label="Result">
          <Card className="stack">
            <div className="stat-row">
              <Stat size="lg" value={formatDuration(result.duration)} label="final length" />
              {result.target_seconds && <Stat size="lg" tone={result.target_met ? 'yellow' : 'white'} value={result.target_met ? 'Hit' : 'Missed'} label={`target ${formatDuration(result.target_seconds)}`} />}
            </div>
            {result.note && <Banner tone="warn">{result.note}</Banner>}
            {result.warnings.map((w) => (
              <Banner key={w} tone="warn">{w}</Banner>
            ))}
            {files.video ? (
              <video className="player" controls preload="metadata" src={jobFileUrl(job.id, files.video)} />
            ) : (
              <audio className="player-audio" controls src={jobFileUrl(job.id, 'voice.mp3')} />
            )}
            <div className="row">
              <Button variant="secondary" onClick={() => navigate('/captions')}>Change captions and re-render</Button>
            </div>
          </Card>

          <Card className="stack">
            <h2 className="title">Downloads</h2>
            <ul className="downloads">
              {DOWNLOADS.filter((d) => files[d.key]).map((d) => (
                <li key={d.key} className="download">
                  <div>
                    <strong>{d.label}</strong>
                    <span className="muted"> {d.note}</span>
                  </div>
                  <a className="btn btn--secondary" href={jobFileUrl(job.id, files[d.key], true)} download>
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section className="stack" aria-label="Command line">
        <div className="card-head">
          <h2 className="title">Do the same from the terminal</h2>
          <Badge>Same engine</Badge>
        </div>
        <CodeWindow title="Terminal">{cliCommand(draft)}</CodeWindow>
      </section>
    </div>
  )
}
