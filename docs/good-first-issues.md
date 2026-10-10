# Good first issues (ready to post)

Ten starter issues for contributors, drafted for launch (plan item P5-07). Create each one on GitHub with the
labels `good first issue` and `help wanted` plus the extra label shown. The GitHub CLI does it in one line:

```bash
gh issue create --title "<title>" --label "good first issue,help wanted,<extra label>" --body-file <body.md>
```

Before posting, create the labels once: `good first issue`, `help wanted`, `captions`, `fonts`, `voices`,
`formats`, `docs`, `i18n`.

---

## 1. Add a caption style preset: "typewriter"
**Extra label:** `captions`

Caption styles are single JSON files in `narrareel/presets/styles/` (see `minimal.json` for a small one and
`schema.json` for every field).

- Copy `minimal.json`, pick a new `id`/`name`, and change colours, font, highlight mode and animation.
- Run `UPDATE_GOLDEN=1 pytest tests/unit/test_captions.py tests/unit/test_visual_regression.py` to record the
  golden `.ass` file and preview hash, then check the new frame with `narrareel preview script.txt --style <id>`.
- Add a line to the style table in the README.

Done when: `narrareel styles` lists it, `pytest` and `ruff check` pass.

## 2. Add a caption style preset: "highlighter"
**Extra label:** `captions`

Same steps as above, but with a marker-pen look: a yellow box (`highlight.box`) that sweeps behind the active
word on a dark, calm video. Keep the text readable inside the platform safe zones.

## 3. Add a font family
**Extra label:** `fonts`

Fonts come from Google Fonts' GitHub repo and are listed in `scripts/fetch_fonts.py`.

- Add one OFL-licensed family (display or hand-written fonts work well for captions).
- Run `python scripts/fetch_fonts.py`; it writes `manifest.json` and copies the licence file.
- Confirm `narrareel fonts` shows it and `pytest tests/unit/test_captions.py` still passes.
- Add the family to `THIRD_PARTY_LICENSES.md`.

## 4. Add a LinkedIn and an X (Twitter) format preset
**Extra label:** `formats`

Formats are JSON files in `narrareel/presets/formats/` (see `square.json`). Add `linkedin` (1:1 or 4:5) and
`x-landscape` (16:9, 1280x720) with sensible caption positions and safe zones, then add them to the format list in
`README.md` and the web app's format step if it is not generated from the API.

## 5. Show friendly names for Kokoro voices in your language
**Extra label:** `voices`

Offline (Kokoro) voices appear as raw ids such as `af_heart`. Add display names (for example "Heart (US, female)")
for the voices of one language so the Voice step lists them clearly. See `narrareel/engines/kokoro.py`.

## 6. Detect one more language and set its default speaking rate
**Extra label:** `i18n`

NarraReel only tells English and Hindi apart (`detect_language` in `narrareel/script/analyze.py`) and has default
speaking rates in `DEFAULT_CPS` in `narrareel/script/duration.py`. Add detection for one more script or language
(Spanish, Arabic, Tamil, ...) with a realistic default characters-per-second value, and tests in
`tests/unit/test_analyze.py` and `tests/unit/test_duration.py`. Mention where you got the rate from in the PR.

## 7. Improve sentence splitting for your language
**Extra label:** `i18n`

`narrareel/script/analyze.py` splits scripts into sentences. Pick a language and add test cases for abbreviations,
quotes, ellipses and decimal numbers that split in the wrong place; then fix the rules. Add the cases to
`tests/unit/test_analyze.py`.

## 8. Docs: install ffmpeg on your Linux distro
**Extra label:** `docs`

`narrareel doctor` tells people when ffmpeg or libass is missing. Add a short section to `README.md` or a new
`docs/install.md` with the exact commands for Fedora, Arch, openSUSE, Alpine or NixOS (whichever you use) and how to
check that libass is available (`ffmpeg -filters | grep ass`).

## 9. Docs: a captions style guide with screenshots
**Extra label:** `docs`

Render one preview per preset (`narrareel preview`) and add a `docs/captions.md` page that shows each look with its
name, when to use it, and the `--set` tweaks that work well (for example `--set colors.highlight=#00E5FF`).

## 10. Print the NarraReel version in `narrareel doctor`
**Extra label:** `docs`

`narrareel doctor` shows the Python and ffmpeg versions but not NarraReel's own. Print it on the first line so bug
reports contain it. Update the bug report template (`.github/ISSUE_TEMPLATE/bug.yml`) hint and add a CLI test.
