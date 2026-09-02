# huhugerman-backend

**Identity-normalization and correlation prototype for the huhuGERMAN ecosystem.**

This repository documents and implements a specific problem: the same student can arrive through inconsistent identifiers, typos or changing email addresses. It does **not** claim to be the production huhuGERMAN backend.

The deployed student-submission workflow lives in the private `huhugerman-instrument` repository. This repository contains a separate Google Apps Script prototype focused on normalization, UUID generation, hashing and explicit review flags.

## Problem

Authentication and identity correlation are different problems.

A login system can control access and still fail to answer whether two inconsistent records refer to the same person. In a low-friction instructional workflow, forcing registration would also add a step that is not required to submit an exercise.

This prototype therefore explores correlation and data hygiene without pretending to solve full authentication or account management.

## Implemented behavior

The actual implementation is in:

`scripts/identity-normalization.gs`

It currently performs:

- normalization of first and last names;
- email lowercasing and a small set of explicit domain corrections;
- matrícula cleanup and length validation;
- UUID generation for records that do not yet have one;
- SHA-256 hashing of normalized identifying fields;
- visible review markers for invalid or ambiguous values;
- cleanup of residual hashes from an older column.

The code uses Google Apps Script and operates directly on spreadsheet rows.

## Flags instead of silent rejection

A central design choice is to keep ambiguous records visible.

Examples such as an empty name or invalid matrícula are written with explicit markers like:

`⚠️ REVISAR NOMBRE`

or

`⚠️ LONGITUD INVÁLIDA`

The system does not silently discard the submission and does not pretend to know more than it does. Human review remains part of the workflow.

This is a prototype of a broader principle:

> Automate what is deterministic. Surface what is ambiguous.

## Identity layers

The repository separates three concerns conceptually:

```text
Human-facing value   → normalized name / matrícula / email
System identifier    → UUID
Correlation signal   → SHA-256 hash of normalized values
```

The current script does **not** implement a complete cross-platform identity service. It provides normalization and stable identifiers that can support later correlation work.

## What is not implemented

The following ideas were discussed or documented in earlier architecture notes but are not implemented here as a production backend:

- Supabase migration;
- Edge Functions;
- production PostgreSQL schema;
- API endpoints for submissions;
- automated fuzzy identity matching across unrelated accounts;
- account authentication / authorization;
- production merge workflow for duplicate people.

Those should remain labeled as planned or exploratory until code exists.

## Relationship to the private production system

`huhugerman-instrument` is intentionally private because it contains the operational implementation of the h.u.h.u. method, including Form generation, internal field mappings and structured data collection.

This public repository exposes a narrower engineering concern — normalization and correlation — without publishing that protected workflow.

## Stack

| Status | Technologies |
|---|---|
| Implemented here | Google Apps Script · SHA-256 · UUID |
| Engineering patterns | Validation · Normalization · Explicit review flags · Audit-friendly transformations |
| Not implemented here | Supabase · PostgreSQL · Edge Functions · TypeScript backend |

## Related repositories

- [huhugerman-frontend](https://github.com/yassergandhi/huhugerman-frontend) — experimental Astro portal and domain-constrained AI branch
- [huhugerman_mvp_notes](https://github.com/yassergandhi/huhugerman_mvp_notes) — pre-implementation product and architecture documentation
- [resilient-api-integration-demo](https://github.com/yassergandhi/resilient-api-integration-demo) — public failure-handling demo
- `huhugerman-instrument` — private production Apps Script pipeline

## About

**Yasser Gandhi Hernández Esquivel**

Software Developer · German lecturer and researcher

B.S. Web Systems Development (UdeG, 2025) · M.Ed. Pedagogy (UNAM, 2020) · German Studies (UNAM, 2012)

[LinkedIn](https://linkedin.com/in/yassergandhi)
