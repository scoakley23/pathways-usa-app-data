# Screen check (`npm run screens`)

Opens the app's main screens at 360, 390, 768, 1280 and 1440 px wide, in English and Arabic (right-to-left), and checks each one:

- **No sideways scrolling** (fails the run).
- **No serious or critical axe accessibility problems** (fails the run).
- **Tap targets at least 44 × 44 px** (listed as notes; a link inside a sentence may be smaller).

It saves a screenshot of every screen at every width to `screens-out/` (not committed). Open `screens-out/index.html` to see them side by side; `screens-out/results.json` has the details.

## How it works

- The app runs with Vite in dev mode and the Supabase switch on, pointed at a **fake** Supabase address. The script answers every request itself with made-up data for one fake learner, "Test Learner" (`test.learner@example.com`), so the signed-in screens show up. Nothing leaves the machine: requests to any other site are blocked.
- Screens without data (no progress yet) are shown empty, the same way a new learner sees them.
- Needs Playwright and its Chromium, the same as `npm run icons`.

## Options

```bash
npm run screens -- --only=today,course --widths=360,1280 --langs=en
```

The list of screens is `SCREENS` in `check-screens.mjs`. Add a screen there when a new page lands.
