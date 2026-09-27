# faithudall.com

Single-page CV and professional portfolio for **Faith Udall** — early childhood educator, Portland, OR.

Live at [faithudall.com](https://faithudall.com) via GitHub Pages (the `CNAME` file handles the custom domain — don't delete it).

## How it's built

Plain HTML + CSS, no build step, no frameworks. Edit, commit, push — GitHub Pages redeploys automatically in a minute or two.

| File | What it is |
| --- | --- |
| `index.html` | The whole site — all sections, with `<!-- ✏️ -->` comments marking spots to personalize |
| `styles.css` | All styling — colors and fonts live in the `:root` block at the top, so re-theming is a five-line edit |
| `CNAME` | Points GitHub Pages at faithudall.com — leave it alone |

Fonts: Fraunces (headings) + Nunito (body), loaded from Google Fonts.
The page carries `Person` structured data in a `<script type="application/ld+json">` block so it can surface in search under her name — keep the name, title and links there in sync with the page.

## Sections

Header · Intro/Summary · Experience · Education · Credentials & Training in Progress · Philosophy · Portfolio/Media · Contact

Nav links are just anchors to section `id`s.

## Still to fill in

- **Philosophy** — currently a marked placeholder. Nothing in that section is Faith's writing; it needs replacing before the site is shared.
- **Intro summary** — assembled from confirmed facts only; worth a rewrite in her voice.
- **Headshot** — the intro uses an `FU` monogram block. Drop a photo in `images/` and follow the comment above `intro-art`; `.intro-photo` styles are already waiting.
- **Portfolio slots** — four labeled empty slots. Replace a whole `<li class="slot">` with `<li class="slot slot-filled"><img …></li>`. Instagram [@ms.ukinder](https://www.instagram.com/ms.ukinder/) is the live content in the meantime.

## Content rules to preserve

- City-level locations only (Portland, OR / Seattle, WA) — no neighborhoods, no street addresses.
- No phone number or personal email; `hello@faithudall.com` is the only contact.
- Student support is described in general terms — no specific diagnoses or conditions, since those describe real children.
- No `noindex` or other crawler blocking; the site is meant to be discoverable.

## Easy customizations

- **Colors** — the palette variables at the top of `styles.css` (`--terracotta`, `--sage`, `--sun`, etc.).
- **New sections** — copy an existing `<section class="section">` block; add `section-alt` for a banded background.
