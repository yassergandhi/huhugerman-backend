# Data Sanitization Strategy

## Philosophy

Data sanitization in this project follows one rule:

> **Never block the user. Always protect the system.**

The goal is to absorb human error while preserving operational integrity.

---

## Name Sanitization

- Removes invalid characters
- Preserves accents (Spanish & German)
- Normalizes spacing
- Applies Proper Case

If sanitization fails:
- The field is replaced with a visible ⚠️ marker
- The record remains usable

---

## Email Sanitization

The system:
- Trims whitespace
- Normalizes case
- Fixes common domain typos (heuristic-based)

Examples:
- `gamil.com` → `gmail.com`
- `outlok.com` → `outlook.com`

No submission is rejected due to email formatting.

---

## Student ID (Matricula) Rules

Business logic:
- Valid IDs are **5–10 digits**
- External users are explicitly marked as `EXTERNO`

Invalid cases:
- Non-numeric input
- Incorrect length

These are flagged, not blocked.

---

## Why Flags Instead of Errors?

Blocking validation:
- Increases frustration
- Generates support tickets
- Breaks mobile workflows

Flagging:
- Preserves continuity
- Enables later review
- Scales better operationally

---

## CSE Outcome

- Fewer manual corrections
- Clear audit signals
- Stable backend state despite noisy input
