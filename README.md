<!-- glassbox:start -->
<!-- Generated from glassbox.json by the Glassbox hub (npm run readme -- bridgeclear). Edit glassbox.json, not this block. -->

<h1 align="center">BridgeClear</h1>

<p align="center"><b>How does a bridge hold weight?</b><br>A bridge is just a way of handing weight sideways to the ground. Drag a load across, bend a beam, break an arch, and see why Tacoma Narrows fell for a surprising reason.</p>

<p align="center"><a href="https://glassbox.how/bridgeclear/"><b>▶ Play with it</b></a> &nbsp;·&nbsp; <a href="https://glassbox.how/e/bridgeclear/">Read the 60-second explainer</a></p>

<p align="center">
  <a href="https://glassbox.how/e/bridgeclear/"><img alt="Glassbox No. 228" src="https://img.shields.io/badge/Glassbox-No.%20228-8ef0ff"></a>
  <a href="https://glassbox.how/e/bridgeclear/"><img alt="Machines" src="https://img.shields.io/badge/field-Machines-ff7a59"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-3fb950"></a>
  <a href="LICENSE-CONTENT.md"><img alt="Content: CC BY 4.0" src="https://img.shields.io/badge/content-CC%20BY%204.0-ef9421"></a>
  <a href="#privacy"><img alt="Privacy: explained" src="https://img.shields.io/badge/privacy-explained-555"></a>
</p>

## In 60 seconds

1. **Two forces do all the work.** Every bridge turns a downward load into compression (squeezing) and tension (stretching). Drag a load across a beam and watch the top turn blue and the bottom red.
2. **Triangles do not bend.** A truss keeps only the parts that work. Its triangles cannot change shape without a member changing length, so every stick is simply squeezed or stretched.
3. **An arch turns weight into squeeze.** A curve lets stone carry a load in pure compression. The line of thrust runs through the ring, and the abutments must push back against the sideways thrust.
4. **Cables hang, towers stand.** A suspension bridge hangs its deck from cables in tension, with towers in compression and huge anchorages at the ends. Cable-stayed bridges run straight stays from tower to deck.
5. **Tacoma was flutter, not simple resonance.** In 1940 wind and a twisting deck fed each other until the bridge tore apart. That is aeroelastic flutter. Ordinary resonance stays bounded.
6. **Footsteps, fatigue and floods.** The Millennium Bridge swayed when walkers fell into step with it. Cracks grow a little with each load cycle, and floodwater can dig out the ground under a pier.

## Words worth knowing

| Term | Meaning |
|---|---|
| **Compression** | A squeezing force that pushes the particles of a material together. |
| **Tension** | A stretching force that pulls the particles of a material apart. |
| **Load path** | The route a load takes through a structure to the ground. |
| **Truss** | A rigid frame of straight members joined at their ends, built from triangles. |
| **Line of thrust** | The path the squeezing force takes through the stones of an arch. |
| **Abutment** | The solid support at each end of an arch or bridge that resists its sideways push. |
| **Catenary** | The curve of a flexible cable hanging under its own weight. |
| **Aeroelastic flutter** | A self-feeding vibration where a structure's motion changes the wind forces that act on it. |
| **Lateral lock-in** | When a crowd falls into step with a swaying deck and pushes it harder. |
| **Fatigue** | Damage from repeated loading, where a crack grows a little each cycle. |
| **Scour** | Erosion of the riverbed around a bridge foundation by moving water. |

## A short history

**From grass ropes and Roman stone to 2,023-metre steel spans, and the failures that taught engineers what the numbers missed.**

- **605** · Li Chun's Zhaozhou Bridge (Li Chun, Zhaoxian, Hebei, China)
- **1779** · The Iron Bridge crosses the Severn (Thomas Farnolls Pritchard and Abraham Darby III, Coalbrookdale, England)
- **1883** · The Brooklyn Bridge opens (John, Washington and Emily Warren Roebling, New York, USA)
- **1890** · The Forth Bridge opens (John Fowler and Benjamin Baker, Scotland, UK)
- **1937** · The Golden Gate Bridge opens (Joseph Strauss, Charles Ellis, Leon Moisseiff, Irving Morrow, San Francisco, USA)
- **1940** · Galloping Gertie twists apart (Leon Moisseiff and Frederick Farquharson, Tacoma, Washington, USA)
- **1967** · The Silver Bridge collapses (Silver Bridge, Point Pleasant, West Virginia, USA)
- **1971** · National Bridge Inspection Standards (US Congress and the Federal Highway Administration, USA)

The full story, with 30 moments, charts, people and 47 sources: [glassbox.how/e/bridgeclear/history](https://glassbox.how/e/bridgeclear/history/). The data lives in [`history.json`](history.json).

## Privacy

This box has no accounts and no ads, and it ships its own fonts and libraries. When you run it yourself it sends nothing anywhere. On glassbox.how, the site's `/bar.js` also loads Glassbox's analytics: **Google Analytics** to count visits (it asks first in the EU, UK and Switzerland, and stays off when your browser sends Global Privacy Control or Do Not Track) and **ClickTrust** to detect bots.

It remembers a few things **in your own browser only**, and never sends them anywhere:

| Browser storage key | What it holds |
|---|---|
| `bridgeclear.v1` | Which chapters you have opened, your best quiz scores, and sound on or off. |

Exactly what each one sees is at [glassbox.how/privacy](https://glassbox.how/privacy/).

## Licences

- **Code:** [MIT](LICENSE). Use it, change it, ship it.
- **Explanations, text, images and videos** (`glassbox.json`, `glassbox/`): [CC BY 4.0](LICENSE-CONTENT.md). Credit “Glassbox, glassbox.how/e/bridgeclear”.
- **Third-party parts** keep their own licences: [three.js](https://threejs.org) (MIT), [Geist, Instrument Serif](https://openfontlicense.org) (SIL OFL 1.1).
- The Glassbox name and logo aren't covered by either licence. See the [terms](https://glassbox.how/terms/).

Found a mistake? [Open an issue](https://github.com/bdeeps/bridgeclear/issues). Corrections happen in public.
<!-- glassbox:end -->

## Run it

It's plain HTML, CSS and JavaScript. No build step and no dependencies. Run locally, it contacts no other website.

```bash
python3 -m http.server 8000
```

Three.js and the fonts ship in `vendor/` and `fonts/`, so it also works offline.

Then open http://localhost:8000.

## How it's built

| File | What |
|---|---|
| `index.html`, `css/app.css` | The page and its styles |
| `js/app.js`, `js/stage.js`, `js/ui.js`, `js/kit.js` | The shared Glassbox 3D engine: chapters, 3D stage, controls, quiz, video director |
| `js/chapters/*.js` | One file per chapter: the 3D model, controls, text, key terms, quiz and video scenes |
| `glassbox.json` | Title, question, explainer beats, key terms, browser storage and credits shown on glassbox.how |
| `reel` in each chapter | The storyboard the Glassbox studio records into short videos |
| `glassbox/` | The published video, slides, thumbnail and post copy |
| `fonts/`, `vendor/three/` | Self-hosted Geist and Instrument Serif (SIL OFL 1.1) and three.js (MIT) |
