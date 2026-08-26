# faithudall.com

Personal site for **Faith Udall** — early childhood educator (preschool & TK), and home base for whatever comes next: daycare plans, summer programs, workshops.

Live at [faithudall.com](https://faithudall.com) via GitHub Pages (the `CNAME` file handles the custom domain — don't delete it).

## The design

Thin, sleek, editorial — with quiet craft layered on top. Warm off-white and near-black carry the whole page, a muted terracotta accent does the underlines and lines, and a muted sage (`--accent-2`) marks status dots only. No cards or drop shadows; everything is drawn with a 1px hairline. Headings and the wordmark are set in Italiana (a thin, high-contrast serif); body copy and UI are Jost (light, geometric); tiny tracked labels are DM Mono. A whisper of SVG paper grain sits over everything.

The crafted details, all honoring `prefers-reduced-motion`:

- **The apple** — a real shaded 3D apple (three.js, vendored in `vendor/`; lathe-built in code, glossy clearcoat red, stem dimple, stem and three leaves on yaw pivots so they never vanish edge-on) turns and bobs above Faith's open palm in the hero. It floats on a deep bob, rocks on a slow side-wave, and turns steadily around its own centre; scrolling shoves it out of step with the page and an under-damped spring chases the page back, overshooting before it settles. `apple3d.js` drives the CSS shadow on her palm from the real bob height — higher float, smaller and fainter shadow — so it reads as genuinely in the air.
- **The field** — a faint offset dot-grid across the hero, every square lifted and brightened by a slow layered sine swell: a plane deforming topologically, quiet enough to read as texture.
- **Letter accents** — the dots the wordmark's A's already carry, located per-pixel in the artwork, overlaid in terracotta and breathing on offset phases.
- **Drawn underlines** — one key word per heading gets a hand-swept stroke that draws itself in on reveal.
- **Sketches** — each row in Days hides a line drawing that sketches itself in on hover.
- **Print marks** — registration `+` marks at the ends of every section rail; a reading-progress hairline at the top of the page.
- **The wordmark unveils** left-to-right on load; the eyebrow arrives one letter at a time.
- **Someday** keeps a soft tinted band with a dot grid drifting slow as weather.
- **Moments** photos drift a few pixels of parallax as you scroll and warm from grayscale to colour on hover.
- **The theme flip** sweeps the new theme in as a circle from the toggle you clicked (View Transitions API, falls back gracefully). "Naptime" accents are re-picked, remembered per visitor, and applied on load with no flash.
- **The stages** — two full-bleed bands in the studio photos' own warm tan (`--stage-bg`, sampled from each photo, edges melted with gradient fades so Faith stands in the page, not in a rectangle). In Days she presents toward the four things she does, floating as levitating cards on desynchronized periods; in Hello she points down at the platform card holding the email button — the photo direction decides the layout.

The Moments section is built for photos: swap any `tile--soon` placeholder for a `<figure class="tile"><img …></figure>` (add `tile--tall` / `tile--wide` to change its footprint). Photos there and in About render in a soft grayscale that warms to full colour on hover.

## The logo

Two pieces of artwork Colin designed, both processed into transparent PNGs:

| File | Used for |
| --- | --- |
| `images/wordmark.png` | The big "Faith Udall" lockup in the hero |
| `images/monogram.png` | The small "FU" mark in the nav bar |
| `images/monogram-square.png` | Monogram pre-centered on a transparent square, for anywhere a square asset is handy |
| `images/icon-*.png`, `favicon.ico` | Generated from the monogram, composited onto the site's off-white — the favicon and iOS home-screen icon |

`.chrome__logo` is CSS-inverted in naptime (`filter: invert(1)`), so the near-black mark reads as near-white on the dark ground without needing separate light/dark image files. The hero wordmark stays ink in both themes — its tan stage band doesn't change with the theme.

## How it's built

Plain HTML + CSS + one vanilla JS file. No build step, no frameworks. Edit, commit, push — GitHub Pages redeploys in a minute or two.

| File | What it is |
| --- | --- |
| `index.html` | All content and structure, with `<!-- ✏️ -->` comments marking spots to personalize |
| `styles.css` | All styling — the full palette lives in the `:root` block at the top (light) and the `[data-theme="dark"]` block (naptime) |
| `main.js` | The hero field, theme toggle, scroll reveals, progress hairline and parallax |
| `apple3d.js` | The 3D apple (ES module; imports three from the import map in `index.html`) |
| `vendor/` | three.js (module + core) and RoomEnvironment, vendored so there's still no build step |
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
