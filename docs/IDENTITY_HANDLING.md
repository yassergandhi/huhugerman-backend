# Identity Handling & Resolution Strategy

## The Mobile User Problem

In mobile-first environments, Google Forms frequently submit responses using:
- The Play Store account
- A previously logged-in Google session
- A non-institutional email

As a result, **the Google account used to submit the form is unreliable as an identity signal**.

This system explicitly avoids relying on Google’s automatic email collection.

---

## Identity Design Principles

1. **Humans are inconsistent**
2. **Systems must be tolerant, not brittle**
3. **Identity must be resolved server-side**
4. **No user should be blocked due to identity ambiguity**

---

## Identity Model

The system uses **three layers of identity**, each serving a different purpose:

### 1. Human Identity (Editable)
- Name
- Email
- Student ID (Matricula or EXTERNO)

This layer may change and may contain errors.

---

### 2. System Identity (Immutable)
- UUID (generated on first ingestion)

Purpose:
- Internal reference
- Never exposed to users
- Never regenerated

---

### 3. Resolution Fingerprint
- SHA-256 hash of:
email | matricula | fullName


Purpose:
- Detect duplicates
- Link submissions across changing emails
- Avoid exposing raw PII

> ⚠️ This hash is **not a security mechanism**.  
> It is an **identity correlation tool**.

---

## Identity Resolution Hierarchy

When linking new submissions:

1. **Exact email match** → High confidence
2. **Student ID match** → High confidence (email may change)
3. **Normalized full name match** → Medium confidence (external users)

If no match is found:
- The record is treated as a new identity
- No submission is blocked

---

## Why No Authentication?

Authentication systems introduce:
- High cognitive load
- Increased technical debt
- Failure modes irrelevant to the learning goal

For this use case, **identity resolution is more effective than identity enforcement**.

---

## CSE Impact

- Reduced support tickets
- No user lockouts
- Stable progress tracking
- Human-reviewable edge cases