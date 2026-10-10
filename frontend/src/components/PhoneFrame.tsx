import { useMemo, useState } from 'react'
import { usePreviewUrl } from '../hooks/useAsync'
import { toProject, useDraft } from '../state/project'
import { useCatalog } from '../state/catalog'
import { Switch } from './ui'

const SAMPLE = 'This is how your captions will look. Every word lands exactly when it is spoken.'

/** The live caption frame: the real renderer's output for the user's own script and style. */
export function PhoneFrame({ compact = false }: { compact?: boolean }) {
  const draft = useDraft()
  const format = useCatalog((s) => s.formats.find((f) => f.id === draft.format))
  const [zones, setZones] = useState(false)
  const usingSample = !draft.script.trim()

  const project = useMemo(() => {
    const p = toProject({ ...draft, script: usingSample ? SAMPLE : draft.script })
    return p
  }, [draft, usingSample])

  const isVideo = !!format?.width
  const { url, error, loading } = usePreviewUrl(project, isVideo)
  const ratio = format?.width && format.height ? `${format.width} / ${format.height}` : '9 / 16'
  const landscape = !!format?.width && !!format.height && format.width > format.height

  return (
    <aside className={`preview ${compact ? 'preview--compact' : ''}`} aria-label="Caption preview">
      {isVideo ? (
        <>
          <div
            className={`phone ${landscape ? 'phone--landscape' : ''}`}
            style={{ aspectRatio: ratio }}
            aria-busy={loading}
          >
            {url && <img className="phone__img" src={url} alt="A frame of your video with captions" />}
            {!url && !error && <div className="phone__placeholder">Rendering a frame…</div>}
            {zones && format && (
              <div className="phone__zones" aria-hidden="true">
                <span className="zone zone--top" style={{ height: `${(format.safe_zone.top ?? 0) * 100}%` }} />
                <span className="zone zone--bottom" style={{ height: `${(format.safe_zone.bottom ?? 0) * 100}%` }} />
                <span className="zone zone--right" style={{ width: `${(format.safe_zone.right ?? 0) * 100}%` }} />
              </div>
            )}
            {loading && url && <span className="phone__busy" aria-hidden="true" />}
          </div>
          <div className="preview__meta">
            <span className="preview__note">
              {usingSample ? 'Sample text. Your script appears here once you add it.' : 'Frame from your script'}
            </span>
            {format && format.id === 'reels' && (
              <Switch label="Show app buttons area" checked={zones} onChange={setZones} />
            )}
          </div>
          {error && <p className="preview__error">{error}</p>}
        </>
      ) : (
        <div className="phone phone--audio">
          <p>Audio only exports the voiceover, subtitles and word timings. There is no video frame to preview.</p>
        </div>
      )}
    </aside>
  )
}
