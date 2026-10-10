# NarraReel

**Your script. Your voice. Viral captions. 100% open source.**

NarraReel turns a script you wrote into a Reel, Short or YouTube video: narrated in a free AI
voice (online or fully offline), timed to the exact length you want, with word-synced captions.
Voice cloning with an energy control is on the roadmap. Everything runs on your computer.

> **Status: rebuilding.** NarraReel is the successor of Text2Reel Generator. The new engine
> (script analysis, duration targeting, voices, word timings, subtitles) is usable from the
> command line and in the web app. See [WHAT_TO_DO.md](WHAT_TO_DO.md) for the plan and progress.
> The old Streamlit prototype was removed; it lives on in the git history.

## Install

You need Python 3.10+ and [ffmpeg](https://ffmpeg.org/) (with libass).

```bash
git clone https://github.com/SanTiwari07/NarraReel.git
cd NarraReel
pip install -e .                 # online voices (Microsoft Edge)
pip install -e ".[offline]"      # + offline voices (Kokoro)
pip install -e ".[align]"        # + precise word timing for any voice
narrareel doctor                 # checks everything
```

Install ffmpeg: `winget install Gyan.FFmpeg` (Windows), `brew install ffmpeg` (macOS),
`sudo apt install ffmpeg` (Linux).

## Use it

```bash
narrareel voices --lang en                      # list voices as <engine>:<voice>
narrareel analyze script.txt --target 6m        # how long will it be? how do I fit 6:00?
narrareel speak script.txt --target 60s         # exact length: pauses first, then speed
narrareel speak script.txt --voice edge:en-US-AndrewNeural --energy 0.8 -o out/
narrareel prepare kokoro                        # one-time offline model download (~140 MB)
narrareel speak script.txt --voice kokoro:af_heart
```

`speak` writes `voice.mp3`, `voice.wav`, `words.json` (start/end of every word) and
`captions.srt` to the output folder.

How the length control works: your script is spoken one sentence at a time, so NarraReel knows
the real duration of every sentence. It then stretches or shrinks the *pauses* between sentences
first (this sounds natural), changes the speed only for what is left, and finally nudges the whole
narration by at most 6%. If the target is still out of reach it tells you how many words to add
or cut.

## Licence

MIT. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for dependencies and models.
