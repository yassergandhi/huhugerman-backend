# huhuGERMAN-CSE

## Overview
huhuGERMAN-CSE is an implementation-focused project that demonstrates how to design **robust, low-friction identity handling and data normalization** for real-world educational environments.

The project is intentionally **not** about teaching German.  
Its purpose is to showcase **Customer Success Engineering** practices applied to onboarding, data hygiene, identity resolution, and operational stability under imperfect user behavior.

This repository represents the **backend and implementation layer** of the huhuGERMAN ecosystem.

---

## Problem Context

In hybrid university environments (UAM / UNAM):

- Most students submit forms from **mobile devices**
- Google Forms often uses the **wrong logged-in account**
- Some students are **external** (no institutional email or student ID)
- Users frequently:
  - Misspell email domains
  - Change emails between submissions
  - Enter inconsistent IDs or names

Traditional assumptions about identity (email = user) **do not hold**.

---

## Solution Summary

This project implements:

- Strict but non-blocking **data sanitization**
- A **hierarchical identity resolution strategy**
- Backend-generated **UUIDs** for stable internal identity
- **SHA-256 hashing** for deduplication without exposing PII
- Clear human-readable flags for manual review when needed

The system prioritizes:
- Continuity of user flow
- Data integrity
- Low operational friction
- Reduced support overhead

---

## Tech Stack

- Google Forms (input collection)
- Google Sheets (Single Source of Truth)
- Google Apps Script (identity & normalization engine)

---

## What This Project Demonstrates

- Real-world Customer Success Engineering
- Implementation trade-offs under constraints
- Identity resolution without au
