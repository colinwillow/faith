# faithudall.com

Personal site for **Faith Udall** — early childhood educator (preschool & TK), and home base for whatever comes next: daycare plans, summer programs, workshops, or just showcasing her work.

Live at [faithudall.com](https://faithudall.com) via GitHub Pages (the `CNAME` file handles the custom domain — don't delete it).

## How it's built

Plain HTML + CSS, no build step, no frameworks. Edit, commit, push — GitHub Pages redeploys automatically in a minute or two.

| File | What it is |
| --- | --- |
| `index.html` | The whole site — all sections, with `<!-- ✏️ -->` comments marking spots to personalize |
| `styles.css` | All styling — colors and fonts live in the `:root` block at the top, so re-theming is a five-line edit |
| `CNAME` | Points GitHub Pages at faithudall.com — leave it alone |

## Easy customizations

- **Bio & copy** — everything in `index.html` is placeholder-ish starter text; rewrite it in Faith's voice.
- **Photo** — the hero currently uses a CSS illustration (sun + blocks). To use a real photo, drop it in an `images/` folder and follow the comment in `index.html` above `hero-art`.
- **Email** — the contact button uses `hello@faithudall.com` as a placeholder; swap in a real address (or set that one up with your domain provider's email forwarding).
- **Colors** — tweak the palette variables at the top of `styles.css` (`--terracotta`, `--sage`, `--sun`, etc.).
- **New sections** — copy an existing `<section class="section">` block as a template; the nav links at the top just point to section `id`s.

## Ideas for later

- A page per venture (daycare, summer camp) once plans firm up
- A simple contact form (Formspree or similar works with static sites)
- Photo gallery of classroom projects
- Blog / updates via GitHub Pages' built-in Jekyll support
