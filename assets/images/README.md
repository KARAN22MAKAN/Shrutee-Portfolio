# How to add your own images

The site expects images at these exact paths, inside `assets/images/`.
Keep the **same filenames** — just replace the file content with your own photo/screenshot,
same format (.jpg) and ideally the same aspect ratio (16:9, e.g. 1456×840px or any multiple of it).

Right now, every file in `assets/images/` is a placeholder graphic that shows you
exactly what should go there. Swap them out one at a time — the site will pick up
the change automatically the next time you open/refresh index.html.

| Filename                  | What goes here                                              | Used in section        |
|----------------------------|--------------------------------------------------------------|--------------------------|
| hero.jpg                  | Your main hero photo (or keep it text-only — see note below) | Start / Hero            |
| about.jpg                 | A personal photo for About Me                                 | About                   |
| graduation.jpg             | Graduation / college photo(s)                                  | Experience              |
| designer.jpg               | Proof of IEEE design work (post screenshots, event posters)    | Experience              |
| event-organizer.jpg        | Event photos (colloQ'22 or similar)                            | Experience              |
| ownd.jpg                   | OWND project visual (brand creative, mockup, or campaign shot) | Featured Projects       |
| aretto-calendar.jpg        | Screenshot of the Aretto content calendar/table                | Featured Projects       |
| cetaphil.jpg               | Screenshot of the Cetaphil ad campaign structure/table          | Featured Projects       |
| aretto-branding.jpg        | Aretto branding/product creative mockups                       | Featured Projects       |
| wedding-invites.jpg        | Wedding invitation suite designs                                | Design Work             |
| contact.jpg                | A professional photo for the Contact section                   | Contact                 |

## Adding more than one image to a slot (auto-slideshow)

Any slot can hold multiple images. If more than one is found, the site
automatically turns it into a slideshow with arrows and dots — no code
changes needed. If only one image is found, it stays a plain image.

**Naming pattern** (inside `assets/images/`):
```
name.jpg           <- slide 1
name (2).jpg        <- slide 2
name (3).jpg        <- slide 3
...and so on, no gaps in the numbering
```
If you don't want a bare `name.jpg`, you can start numbering at `name (1).jpg` instead — either works.

**Example already set up for you:** the `wedding-invites` slot currently has 4 demo
slides (`wedding-invites.jpg`, `wedding-invites (2).jpg`, `(3).jpg`, `(4).jpg`) so
you can see the slideshow working right away — replace all 4 with your real
Mehndi / Sangeet / Haldi / Reception card images (same filenames) to make it real.

Rules to keep in mind:
- Keep numbering sequential — if `(3)` is missing, `(4)` and beyond won't be checked.
- Extensions `.jpg`, `.jpeg`, `.png`, and `.webp` are all supported, mixed or not.
- Up to 9 images per slot are supported by default (1 bare + 8 numbered) — tell me if you need more.

**Auto-advance timer:** slideshows auto-advance every 5 seconds by default (pausing on hover/focus, with a pause/play button in the corner). To change the timing for a specific slot, edit its `data-interval` attribute in `index.html` — e.g. `data-interval="4000"` for 4 seconds (value is in milliseconds). If someone has "reduce motion" turned on in their system settings, auto-advance is skipped automatically — arrows and dots still work.

## Auto-advance (every slideshow, every slot)

Every slot with more than one image automatically advances every **5 seconds** —
this applies everywhere, not just one section. Each slideshow also has:
- `‹` / `›` arrows and dots for manual navigation
- A pause/play button (auto-advancing content must be pausable — this isn't optional polish, it's an accessibility requirement)
- Auto-pause on hover or keyboard focus, so a viewer can look at a slide without it changing underneath them
- Auto-advance is skipped entirely for visitors with "reduce motion" turned on in their OS/browser — manual arrows/dots still work for them

To change the timing for one specific slot only, add `data-interval="8000"` (milliseconds)
to that slot's `<div class="media-slot" data-slot="...">` in `index.html`. Leave it off to use the 5-second default.

## Notes

- **Reference folder**: `assets/images-reference-from-pdf/` contains the original
  full-slide screenshots pulled from your current PDF, in case you want to reuse
  or crop from them instead of finding new files. They are not used by the site directly.
- **Adding a brand-new project** (not in the current PDF): add a new image file with
  a name of your choice (e.g. `project-name.jpg`) to `assets/images/`, then tell me the
  filename and I'll wire up a new section in `index.html` for it — this keeps the
  "More Projects" reserved section from Section 09 ready to activate.
- **Image size tips**: keep files under ~500KB where possible for fast loading. If a
  photo is much larger, resizing to around 1600px on the long edge is plenty for web use.
