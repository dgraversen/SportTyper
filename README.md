# SportTyper 🏒

Learn ten-finger touch typing as an ice hockey goalie.

Every shot comes with a sequence of keys. Pick your position:

- **Goalie**: type the sequence before the puck reaches the net and you make the
  save (glove, blocker or butterfly pad save). Too slow, and it's a goal.
- **Player**: an aim marker shows where you're shooting. Type the sequence before
  the goalie slides across to cover it, and you deke the goalie and score. Too
  slow, and the goalie makes the save.

Either way, a missed shot can be retried straight away.

## Features

- **Goalie or player**: choose your position on the front page.
- **Time per key**: *Lots of time ×2*, *Relaxed ×1.5* (default), *Normal ×1* or *Challenge ×0.75*. Each shot also includes 2 seconds to react.
- **Ten-finger guidance.** The on-screen keyboard is colour-coded by finger. The next key glows, and a pair of hands shows which finger to use, including which pinky holds Shift.
- **19 training levels** that build up step by step. Finishing a level unlocks the next.
- **Stars, accuracy and WPM** for every level. Three stars means a perfect level (no misses) with 95%+ accuracy.
- **Progress saved in the browser**: stars, best WPM and accuracy per level, plus lifetime totals (keys typed, accuracy, minutes practised). A *Continue* button jumps to the next unfinished level, and *Reset progress* clears everything except your custom levels.
- **Level editor.** Create your own levels from random keys, a word list or sentences, and choose how many saves are needed and how fast the shots are. Levels can be exported to and imported from JSON to share them.
- **English and Danish.** Switch language in the top bar. Danish includes translated tips and Danish word lists.
- **US and Danish keyboard layouts**, so the finger guidance matches the physical keyboard (Æ Ø Å on the Danish layout).
- Sound effects made with WebAudio (no audio files), with a mute button.
- Pauses automatically when you switch tabs, so no goals are scored while you're away.

## Levels

| # | Level | Practises |
|---|-------|-----------|
| 1–5 | F & J, D & K, S & L, A & ; / Æ, G & H | The home row |
| 6 | Home row words | Real words from the home row |
| 7–10 | E & I, R & U, T & Y, W O Q P | The top row |
| 11 | Top row words | Words from the home and top rows |
| 12–13 | V B N M, C X Z , . | The bottom row |
| 14 | Hockey words | All letters |
| 15 | Shift & capitals | Capital letters with the opposite pinky |
| 16 | Number row | 1–0 |
| 17–18 | Rink talk, Breakaway | Sentences, then capitals and punctuation |
| 19 | Overtime | Three words per shot at game speed |

## Run it

It's a static site: no build step and no dependencies. Serve the folder with any web server:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>. It works best on a computer with a physical keyboard.

## Controls

| Key | Action |
|-----|--------|
| Type | Type the sequence shown above the rink |
| Enter | Start a level, retry after a goal, or go to the next level |
| R | Replay a finished level |
| Esc | Back to the level list |

## Adding levels in code

Built-in levels live in [`js/levels.js`](js/levels.js). Each level is a plain object:

```js
{
  id: 'l20',                 // unique, used to store progress
  name: 'Left hand only',
  subtitle: 'Q W E R T A S D F G',
  tip: 'Keep your right hand relaxed on J K L.',
  mode: 'keys',              // 'keys' | 'words' | 'lines'
  keys: 'qwertasdfg',        // keys mode: letters to build random groups from
  focus: 'qt',               // keys mode: letters that appear more often (optional)
  // list: ['word', ...],    // words / lines modes
  groups: 2,                 // key groups or words per shot
  shots: 10,                 // saves needed to finish
  wpm: 12,                   // shot speed in words per minute
  da: { name: 'Kun venstre hånd', tip: '…' },  // Danish overrides (optional)
}
```

`{PINKY}` in a level is replaced by the right pinky's home key: `;` on the US layout, `æ` on the Danish one.

## Adding a language

Copy the `en` block in [`js/i18n.js`](js/i18n.js), translate the values, and add the language to the `#langSel` dropdown in `index.html`. Levels can then include a block keyed by the new language code (like `da`) for translated names, tips and word lists.

## Project structure

| File | What it holds |
|------|---------------|
| `index.html` | The page, including the rink and goalie drawn in SVG |
| `css/style.css` | Styles |
| `js/levels.js` | Built-in levels |
| `js/i18n.js` | UI texts (English, Danish) |
| `js/app.js` | Game logic, keyboard layouts, level editor, import/export |

Everything is stored in the browser's `localStorage` (per browser and device):

| Key | Contents |
|-----|----------|
| `sporttyper.progress.v1` | Per level: best stars, WPM, accuracy, number of plays, best stars per position |
| `sporttyper.totals.v1` | Lifetime keys typed, errors, typing time and shots |
| `sporttyper.custom.v1` | Your custom levels |
| `sporttyper.role`, `sporttyper.pace`, `sporttyper.lang`, `sporttyper.layout`, `sporttyper.muted`, `sporttyper.unlockAll`, `sporttyper.lastLevel` | Settings |
