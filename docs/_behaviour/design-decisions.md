# Design and behaviour decisions

Short reference to keep consistency when changing the design.

---

## Languages

- **Supported:** Spanish (es), English (en), Portuguese (pt).
- UI translations in `src/app/core/translations/`.
- Per-example content in `src/app/core/translations/examples/` and in each example’s `manifest.ts`.
- All visible strings must exist in all 3 languages.

---

## Components and limits

### ProcessorNumbersView (02-main-thread)

- **Maximum 7 visible lines** in the numbers grid (0..N).
- Scroll **only inside the numbers container**; do not scroll the page.
- When the current number changes, smooth scroll to centre the item in the container viewport.
- Show current number and binary representation; grid starts at 0.

### Code explanation (“View code”)

- Open/close on **click anywhere** on the header (not only on `<details>`).
- Angular/JS buttons: clicking opens the block with that variant selected.
- Keyboard support: Enter/Space on the summary to toggle.
- Open/closed state with signal (`isOpen`), not just `<details>`.

### Language selector (sidebar)

- **Dropdown** (single button with flag + code + chevron) to avoid overflow on small screens.
- Opens on hover and on click.
- Styles aligned with the sidebar dark theme.

### Example navigation (prev/next)

- When changing example (previous/next), **scroll to top** of the page after navigation (`window.scrollTo`, behaviour `instant`).

### 01-setinterval (thread visualization)

- Fixed height of the thread diagram: **401px**; the diagram fills the remaining space.
- “Slow” mode: `queueCheck` **1400 ms**, `processing` **900 ms**.

### 02-main-thread (Calculate button)

- Loading state **inside the button**: spinner + “Calculating…” text (not a separate spinner).
- Translation `demo.calculating` in es, en, pt.

---

*Update this doc when these behaviours change or new criteria are added.*
