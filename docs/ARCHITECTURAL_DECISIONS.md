# Architectural Decisions Record (ADR)

## Decision: No Authentication System

**Alternative:** Custom login + database  
**Rejected Because:**
- High complexity
- No added value for the learning flow
- Increased failure surface

**Chosen Approach:** Identity resolution via backend logic

---

## Decision: Disable Google Form Email Collection

**Alternative:** Rely on Google account email  
**Rejected Because:**
- Unreliable on mobile
- Causes silent identity mismatches

**Chosen Approach:** Explicit email field + backend validation

---

## Decision: UUID Generated Server-Side

**Alternative:** User-provided ID  
**Rejected Because:**
- Human error
- Inconsistency
- Irreversibility issues

**Chosen Approach:** Backend-generated immutable UUID

---

## Decision: Hash-Based Identity Correlation

**Alternative:** Store raw composite keys  
**Rejected Because:**
- PII exposure
- Poor deduplication ergonomics

**Chosen Approach:** SHA-256 identity fingerprint

---

## Guiding Principle

> Optimize for **operational reality**, not theoretical correctness.
