# faithudall.com

Personal site for **Faith Udall** — early childhood educator (preschool & TK), and home base for whatever comes next: daycare plans, summer programs, workshops.

Live at [faithudall.com](https://faithudall.com) via GitHub Pages (the `CNAME` file handles the custom domain — don't delete it).

## The design

Thin, sleek, editorial. Warm off-white and near-black carry the whole page, with one quiet muted accent used only for underlines and small status marks — never a fill, never a block of colour. There are no cards or drop shadows; everything is drawn with a 1px hairline instead of a box. Headings and the wordmark are set in Italiana (a thin, high-contrast serif); body copy and UI are Jost (light, geometric); tiny tracked labels are DM Mono. Motion is a quiet fade and a short rise — no bounce, no overshoot.

The one section that gets to be a little warmer is **Someday** — a soft tinted band instead of a hairline list, and italic headings.

There's a "naptime" dark theme (the little half-circle in the nav) with re-picked accents, remembered per visitor — switching is instant with no light-to-dark flash, even for a returning dark-theme visitor.

The Moments section is built for photos: swap any `tile--soon` placeholder for a `<figure class="tile"><img …></figure>` (add `tile--tall` / `tile--wide` to change its footprint). Photos there and in About render in a soft grayscale that warms to full colour on hover.

## The logo

Two pieces of artwork Colin designed, both processed into transparent PNGs:

| File | Used for |
| --- | --- |
| `images/wordmark.png` | The big "Faith Udall" lockup in the hero |
| `images/monogram.png` | The small "FU" mark in the nav bar |
| `images/monogram-square.png` | Monogram pre-centered on a transparent square, for anywhere a square asset is handy |
| `images/icon-*.png`, `favicon.ico` | Generated from the monogram, composited onto the site's off-white — the favicon and iOS home-screen icon |

Both `.chrome__logo` and `.hero__mark img` are CSS-inverted in naptime (`filter: invert(1)`), so the near-black artwork reads as near-white on the dark ground without needing separate light/dark image files.

## How it's built

Plain HTML + CSS + one vanilla JS file. No build step, no frameworks. Edit, commit, push — GitHub Pages redeploys in a minute or two.

| File | What it is |
| --- | --- |
| `index.html` | All content and structure, with `<!-- ✏️ -->` comments marking spots to personalize |
| `styles.css` | All styling — the full palette lives in the `:root` block at the top (light) and the `[data-theme="dark"]` block (naptime) |
| `main.js` | Theme toggle and scroll-triggered section reveals |
| `CNAME` | Points GitHub Pages at faithudall.com — leave it alone |
| `images/` | The wordmark, monogram, portrait, and all generated icon sizes |
| `site.webmanifest` | Makes "Add to Home Screen" behave like an app named "Faith" |
| `favicon.ico` | Classic multi-size browser favicon |

## Easy customizations

- **Copy** — starter text throughout; rewrite in Faith's voice.
- **Email** — `hello@faithudall.com` is a placeholder in the hello section; swap in a real address or set up domain email forwarding.
- **Colors** — the whole palette is the token block at the top of `styles.css`. `--accent` is deliberately used in only a handful of places (underlines, status dots, one hover state) — keep it scarce and it keeps working.
- **Idea statuses** — the chips in the someday section (`dreaming` / `sketching` / `someday`) are just text; promote one to `open for signups` when the time comes.
- **The logo** — to try a different lockup, process a new image the same way: crop tight to the ink, key out the background to alpha, save over `wordmark.png` / `monogram.png` (and regenerate the icon sizes from the monogram if it changes).

Dev conveniences: append `?fast` to the URL to skip intro animations (useful for screenshots), `?fast&dark` to preview naptime. Honors `prefers-reduced-motion` throughout.

## Ideas for later

- A page per venture (daycare, summer camp) once plans firm up
- A simple contact form (Formspree or similar works with static sites)
- Photo gallery of classroom projects
