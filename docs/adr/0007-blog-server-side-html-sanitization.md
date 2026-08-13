# 0007 — Blog content is sanitized server-side on every write

## Context

The blog admin editor uses TipTap, a rich-text WYSIWYG editor that outputs HTML. That HTML is rendered on the public blog via `dangerouslySetInnerHTML` — a natural target for stored XSS if a malicious admin (or a compromised admin session, or a future contributor role with narrower trust than `super_admin`) can get to the editor.

## Decision

Every write to `content_html` (create and update, in `BlogAdminService`) passes through `sanitize_rich_text()` (`app/core/html_sanitize.py`, using `bleach`) before hitting the database — an explicit allowlist of tags (`p, br, strong, em, u, s, a, ul, ol, li, blockquote, code, pre, h2, h3, img`) and attributes, with URL protocols restricted to `http`/`https`/`mailto`. The frontend's `dangerouslySetInnerHTML` in `BlogPostPage.tsx` is safe *because* of this — not because the editor is trusted, and not because of any client-side sanitization.

## Alternatives considered

- **Trust the editor's output, sanitize only on render (client-side).** Rejected: sanitizing at render time means every consumer of the data (public page today, potentially an RSS feed or API integration later) has to remember to sanitize independently, and a bug in any one of them reintroduces the XSS hole. Sanitizing once at the write boundary means the stored data is safe by construction for every future reader.
- **Trust TipTap's configured toolbar to only ever produce safe HTML.** Rejected: a toolbar restricting which buttons are visible doesn't stop malicious HTML from reaching the API — the request body isn't bound by what buttons exist in the UI that sent it.

## Consequences

- The tag/attribute allowlist has to be kept in sync with whatever the TipTap toolbar actually supports (currently h2/h3 only, no h1/h4+ — this was already discovered and fixed once when h4 was in an early allowlist draft but the editor doesn't offer it). Adding a new toolbar capability (e.g. tables) requires updating `html_sanitize.py` in the same change, or the new content silently gets stripped on save.
- Sanitization happens before storage, so the "sanitized" version is what's in the database — there's no raw/original copy retained. Acceptable here since the sanitizer only strips genuinely unsafe constructs, not legitimate formatting.
