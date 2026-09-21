# Marble Parade

A tiny, colorful marble-routing puzzle game. Build a path from each start to its matching cup, then watch the little machine come alive.

**[Play online](https://wentaopeng714-cmd.github.io/marble-parade/)** · **[Download the ready-to-play ZIP](https://github.com/wentaopeng714-cmd/marble-parade/releases/download/v1.0.0/marble-parade-v1.zip)**

## Inside the toy box

- Nine handcrafted tables, from a simple bend to three-color cooperative routes.
- Straight rails, bends, springs, magnets, alternating seesaws, switches and gates.
- Limited inventories, three-star challenges, hints, undo, and layout-preserving retries.
- A table selector with sequential unlocks, three table finishes and three marble finishes.
- Rolling animation, compressing springs, swinging gates, moving seesaws, little flags, confetti, and synthesized sound.
- English UI, touch and mouse controls, desktop shortcuts, and local progress saving.
- No account, analytics, network asset requests, or paid services.

## How to play

1. Select a piece, then tap a square to place it. Tap the same piece again to rotate it.
2. Use **Rotate** or **R** to rotate the selected piece, or the next piece before placement. The arrow beside Rotate shows the current orientation.
3. Match the openings between adjacent rails. Springs skip exactly one square and land two squares ahead. Enter a spring or seesaw from behind its arrow.
4. Press **Roll marbles** or **Space**. Each colored marble needs its matching cup. A switch opens every gate with the same color for that run.
5. **Reset run** returns the marbles to their starts while keeping your layout. You can also pause and edit; editing resets the run. Undo returns the previous placement.

A seesaw sends its first marble to the right of its incoming direction, its second left, then alternates. Its small 1 and 2 markers identify the exits. A magnet accepts entry from every side except its arrow and sends a marble along that arrow.

Earn one star for completion, a second for meeting the piece target, and a third for meeting the target without hints. Finish tables 3 and 6 for new table finishes. Collect 6 and 15 stars for new marble finishes. Progress is stored in your current browser, separately for each website address.

## Run the downloaded game

The release ZIP includes the built `dist/` folder and source. Unzip it first.

- **macOS:** double-click `启动游戏.command` (requires Python 3). It starts a loopback-only local server and opens your browser. Keep its terminal open while playing.
- **Any system with Python 3:** run `python3 -m http.server 4195 --bind 127.0.0.1 --directory dist`, then visit `http://127.0.0.1:4195/`.
- Opening `dist/index.html` directly with `file://` does not work reliably because the browser must load JavaScript modules over HTTP.

## Development

Use Node.js 22.18+ and npm.

```sh
npm ci
npm run dev -- --port 4195
npm run test
npm run build
```

The game uses Three.js 0.180.0 and TypeScript. All models, textures, icons, and sound effects are produced by this project. No external art pack is required.

The simulation uses deterministic, rail-constrained paths and analytic spring arcs rather than a general-purpose rigid-body physics engine. This makes puzzle outcomes repeatable while the renderer supplies rolling, bounce and mechanism animation. Simulation runs at a fixed 60 Hz with render interpolation.

`src/levels.ts` defines each table, inventory and one reference solution. `src/simulation.ts` owns the game rules independently of rendering. `src/world.ts` creates the toy scene. `src/main.ts` handles the UI, controls and local save. `tests/preview.html` is a development-only mechanism inspection page; it is not part of the production build.

Automated checks cover every reference solution, finite inventory, immutable fixed pieces, editing and undo, wrong connections, wrong cups, spring gaps, cooperative gates, seesaw routing, pause/resume and profile validation. Desktop and 390 × 844 browser checks cover actual placement, rotation, first-level completion, unlocking, failure/retry, theme UI and multi-marble rendering.

GitHub Pages serves the committed `docs/` copy of the production build. After changing the source, run the build and replace `docs/` with `dist/`, keeping `docs/.nojekyll`.

## License

Project code and original procedural assets: MIT. Three.js: MIT, with its license in `public/licenses/THREE-LICENSE.txt` and the production `licenses/` folder. See `THIRD_PARTY.md`.
