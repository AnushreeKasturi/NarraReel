import { useRef, useState } from 'react'
import { formatDuration } from '../lib/time'
import { useDraft } from '../state/project'
import { useScriptInfo } from '../state/scriptInfo'
import { useSession } from '../state/session'
import { Banner, Button, Card } from '../components/ui'

const LONG_SENTENCE = 35

export function ScriptStep() {
  const { script, targetSeconds, patch } = useDraft()
  const { analysis, plan } = useScriptInfo()
  const toast = useSession((s) => s.toast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const a = analysis.data

  const readFile = async (file: File) => {
    if (!/\.(txt|md|markdown)$/i.test(file.name) && !file.type.startsWith('text/')) {
      toast('error', 'Drop a .txt or .md file.')
      return
    }
    patch({ script: (await file.text()).replace(/^﻿/, '') })
  }

  const editOption = plan.data?.plan.options.find((o) => o.kind === 'edit_script')
  const longest = a ? Math.max(...a.sentences.map((s) => s.seconds), 1) : 1

  return (
    <div className="stack stack--lg">
      <header className="step-head">
        <h1 className="display">Write or paste your script</h1>
        <p className="lede">
          NarraReel reads exactly what you write. Put each beat on its own line, and wrap a word in *asterisks* to make
          it stand out in the captions.
        </p>
      </header>

      <Card className={`script-card ${dragging ? 'script-card--drag' : ''}`}>
        <label htmlFor="script" className="sr-only">
          Script
        </label>
        <textarea
          id="script"
          className="script-input"
          value={script}
          spellCheck
          placeholder={'Wake up early.\nGrind hard.\nSuccess is waiting for you at the end of the road.'}
          onChange={(e) => patch({ script: e.target.value })}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) void readFile(f)
          }}
        />
        <div className="script-card__foot">
          <p className="script-count" aria-live="polite">
            {a && a.word_count > 0 ? (
              <>
                <strong>{a.word_count}</strong> words, {a.sentence_count} sentences, {a.paragraph_count} paragraph
                {a.paragraph_count === 1 ? '' : 's'}. About <strong>{formatDuration(a.estimate.total_seconds)}</strong>{' '}
                at 1.0×
                {a.estimate.basis === 'default' && <span className="muted"> (estimate; it sharpens after your first video)</span>}
              </>
            ) : (
              <span className="muted">Nothing here yet. Type, paste, or drop a .txt or .md file.</span>
            )}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.markdown,text/plain"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void readFile(f)
              e.target.value = ''
            }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Choose a file
          </Button>
        </div>
      </Card>

      {targetSeconds && editOption && editOption.words_delta !== null && (
        <Banner tone="info" title={`Target ${formatDuration(targetSeconds)}`}>
          {editOption.words_delta === 0 || Math.abs(editOption.words_delta ?? 0) < 2
            ? 'Your script fits the target at natural speed.'
            : editOption.message}{' '}
          The count updates as you type.
        </Banner>
      )}

      {analysis.error && <Banner tone="error" title="Could not analyse the script">{analysis.error}</Banner>}

      {a?.language_hint === 'hi' && (
        <Banner tone="info" title="Hindi detected">
          Pick a voice that speaks Hindi in the next steps, and choose Noto Sans Devanagari as the caption font.
        </Banner>
      )}

      {a && a.warnings.length > 0 && (
        <div className="stack" aria-label="Script warnings">
          {a.warnings.map((w) => (
            <Banner key={`${w.code}-${w.sentence_idx ?? ''}`} tone="warn">
              {w.message}
            </Banner>
          ))}
        </div>
      )}

      {a && a.sentences.length > 0 && (
        <details className="sentences">
          <summary>Sentence by sentence ({a.sentences.length})</summary>
          <ol className="sentence-list">
            {a.sentences.map((s) => (
              <li key={s.idx} className="sentence">
                <span className="sentence__text">{s.text}</span>
                <span className="sentence__bar" aria-hidden="true">
                  <span
                    className={`sentence__fill ${s.words > LONG_SENTENCE ? 'sentence__fill--long' : ''}`}
                    style={{ width: `${Math.max(4, (s.seconds / longest) * 100)}%` }}
                  />
                </span>
                <span className="sentence__time">
                  {s.seconds.toFixed(1)} s{s.words > LONG_SENTENCE ? ', long' : ''}
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  )
}
