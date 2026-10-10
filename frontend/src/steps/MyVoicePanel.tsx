import { Card, CodeWindow } from '../components/ui'

/** Replaced by the recorder and saved voices once the cloning engine is installed (Phase 4). */
export function MyVoicePanel() {
  return (
    <Card className="stack">
      <h2 className="title">Clone your own voice</h2>
      <p className="muted">
        Record about 30 seconds, read the guided paragraph the way you want your videos to sound, and NarraReel
        narrates in your voice. Cloning needs an extra install and works best with a GPU.
      </p>
      <CodeWindow title="Terminal">{'pip install "narrareel[clone]"'}</CodeWindow>
    </Card>
  )
}
