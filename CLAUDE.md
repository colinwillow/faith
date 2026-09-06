# Working on this repo

Colin's rule, and it overrides everything else here: **do what was asked, fast.**
Small task, small amount of work. Adding an image should take a minute, not five.

## Don't do this

- Don't spin up a local server, launch Playwright, take screenshots, or measure
  computed styles to "verify" a change. Just make the change.
- Don't crop, resample, grid-overlay, or pixel-diff an image unless the crop was
  the actual request.
- Don't refactor, rebalance, restructure or tidy anything adjacent to the task.
  If something nearby looks wrong, say so in one line and leave it alone.
- Don't bump the version stamp, update the README, or write a five-paragraph
  commit message for a one-line change.
- Don't write a long summary at the end. A sentence or two, then stop.

## Do this

- Make the edit, commit, push to `main`. Always `main` — no branches, no PRs.
- One short commit message line is fine.
- If something is genuinely ambiguous, ask instead of guessing elaborately.

## The one exception

Visual/animation work that can't be judged from the code — a new 3D prop, a
motion tweak, a layout he hasn't seen. There, checking it in a browser is the
job, not overhead. Everything else: just ship it.
