# faithudall.com

Personal site for **Faith Udall** — early childhood educator (preschool & TK), and home base for whatever comes next: daycare plans, summer programs, workshops.

Live at [faithudall.com](https://faithudall.com) via GitHub Pages (the `CNAME` file handles the custom domain — don't delete it).

## The design

*Construction paper, crayon marks, one crayon of colour.* Warm cream paper, warm near-black ink, exactly one terracotta accent (plus a sage green reserved for status dots), hairlines instead of cards, tiny tracked-out mono labels, and one living centerpiece: her name in the hero is written by a particle swarm — a few hundred paper scraps, each carrying its own slice of the real letterforms, so the settled word is pixel-crisp type. Moving scraps warm toward their crayon; settled scraps are pure ink. There's also a "naptime" dark theme (the little half-circle in the nav), remembered per visitor.

## How it's built

Plain HTML + CSS + one vanilla JS file. No build step, no frameworks. Edit, commit, push — GitHub Pages redeploys in a minute or two.

| File | What it is |
| --- | --- |
| `index.html` | All content and structure, with `<!-- ✏️ -->` comments marking spots to personalize |
| `styles.css` | All styling — the full palette lives in the `:root` block at the top (light) and the `[data-theme="dark"]` block (naptime) |
| `main.js` | The name swarm, theme toggle, scroll-driven portrait rings, and section reveals |
| `CNAME` | Points GitHub Pages at faithudall.com — leave it alone |
| `images/` | Icons for favicon, iOS home screen, and social previews — all sizes generated from `icon-1024.png` |
| `site.webmanifest` | Makes "Add to Home Screen" behave like an app named "Faith" |
| `favicon.ico` | Classic multi-size browser favicon |

## Easy customizations

- **Copy** — starter text throughout; rewrite in Faith's voice. The ticker phrases live in `index.html` (each list appears twice — that's what makes the loop seamless; edit both copies).
- **Email** — `hello@faithudall.com` is a placeholder in the hello section; swap in a real address or set up domain email forwarding.
- **Colors** — the whole palette is the token blocks at the top of `styles.css`. The accent (`--crayon`) is deliberately used in only a handful of places; keep it scarce and it keeps working.
- **The swarm word** — `WORD` at the top of the swarm section in `main.js`.
- **Idea statuses** — the chips in the someday section (`dreaming` / `sketching` / `someday`) are just text; promote one to `open for signups` when the time comes.

Dev conveniences: append `?fast` to the URL to skip intro animations (useful for screenshots), `?fast&dark` to preview naptime. Honors `prefers-reduced-motion` throughout.

## Ideas for later

- A page per venture (daycare, summer camp) once plans firm up
- A simple contact form (Formspree or similar works with static sites)
- Photo gallery of classroom projects
