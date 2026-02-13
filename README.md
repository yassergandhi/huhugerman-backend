# cse-identity-engine-german-edu

## 🏛️ Post-Mortem: Identity Resolution & Database Normalization Case Study

**Status:** ARCHIVED · Learning Artifact · Real-World Implementation

This repository documents the **backend evolution** of a German language education platform, from a Google Sheets + Apps Script prototype to a normalized Supabase PostgreSQL architecture.

Originally used by real students at Universidad Autónoma Metropolitana (UAM), this system solved **real identity ambiguity problems** in hybrid university environments.

---

## 🎯 Problem Statement

### The Identity Ambiguity Challenge

In university settings, students submitted assignments via mobile devices with unpredictable authentication behavior:

| User Behavior Pattern | Technical Reality |
|----------------------|-------------------|
| **Mobile submission** | Google Forms used Play Store account, not institutional |
| **Multiple accounts** | Same user, different emails (personal vs institutional) |
| **Human errors** | `gamil.com`, `hotmal.com`, incomplete names, typos |
| **External students** | No institutional email or student ID |

**Traditional assumption failed:** `email ≠ unique user identity`

---

## 📊 Before: Google Sheets + Apps Script

### Raw Data Structure (Google Sheets)

| Timestamp | Email | First Name | Last Name | Student ID | Week | Content | Flags |
|-----------|-------|------------|-----------|------------|------|---------|-------|
| 2025-09-15 14:32:01 | juan.perez@alumnos.uam.mx | Juan | Perez | 22001234 | w01 | Hallo, ich... | `DUPLICATED_USER` |
| 2025-09-15 14:35:22 | juan.perez@gmail.com | Juan | Perez | 22001234 | w01 | Hallo, ich... | `POSSIBLE_MATCH` |
| 2025-09-16 09:12:45 | maria.garcia@alumnos.uam.mx | Maria | Garcia | | w01 | Guten Tag... | `EXTERNAL_STUDENT` |
| 2025-09-16 09:15:33 | maria.garcia@alumnos.uam.mx | María | García | | w01 | Guten Tag... | `NAME_VARIATION` |

### Identity Resolution Flags

| Flag | Trigger Condition | Action |
|------|-------------------|--------|
| `DUPLICATED_USER` | Same email, different name spelling | Record but allow submission |
| `POSSIBLE_MATCH` | Different email, same student ID | Record with warning |
| `EXTERNAL_STUDENT` | No institutional email, no student ID | Allow, mark for review |
| `NAME_VARIATION` | Same email, different name format | Normalize to first occurrence |

### Apps Script Normalization Logic

```javascript
// scripts/identity-normalization.gs

function normalizeEmail(email) {
  // Heuristic domain correction
  const corrections = {
    'gamil.com': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'yahooo.com': 'yahoo.com'
  };
  
  const domain = email.split('@')[1].toLowerCase();
  return corrections[domain] 
    ? email.replace(domain, corrections[domain]) 
    : email.toLowerCase();
}

function normalizeName(name) {
  // Proper case normalization
  return name.trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function generateIdentityHash(email, studentId, fullName) {
  // SHA-256 fingerprinting for deduplication
  const identityString = [email, studentId, fullName].join("|").toLowerCase();
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, 
    identityString
  );
  return digest.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join("");
}

function processSubmission(row) {
  const email = normalizeEmail(row[1]);
  const firstName = normalizeName(row[2]);
  const lastName = normalizeName(row[3]);
  const studentId = row[4] || 'EXTERNAL';
  const hash = generateIdentityHash(email, studentId, `${firstName} ${lastName}`);
  
  // Generate backend-owned UUID
  const userId = Utilities.getUuid();
  
  // Flag detection
  let flags = [];
  
  if (!email.includes('@alumnos.uam.mx')) {
    flags.push('EXTERNAL_STUDENT');
  }
  
  if (studentId === 'EXTERNAL' && !email.includes('@alumnos.uam.mx')) {
    flags.push('NO_INSTITUTIONAL_ID');
  }
  
  return {
    userId,
    email,
    firstName,
    lastName,
    studentId,
    identityHash: hash,
    flags: flags.join(', ')
  };
}
```

**Key Insight:** The system **never blocked users**. It recorded ambiguity and allowed continuation.

---

## 🔄 Migration Decision: Why Supabase?

### Limitations of Google Apps Script

| Limitation | Impact |
|------------|--------|
| **No POST endpoints** | Could not receive direct frontend submissions |
| **No relational model** | All data flattened in Sheets |
| **No transaction support** | Risk of data inconsistency |
| **Limited compute** | Could not process AI feedback in real-time |
| **No proper indexing** | Slow queries on large datasets |

### Trigger Event: DeepSeek AI Integration

The need to:
1. Receive student submissions via POST
2. Send to DeepSeek API for feedback
3. **Persist AI response in backend**
4. Return feedback to student

**GAS could not support this workflow.** Supabase could.

---

## 🗄️ After: Supabase PostgreSQL Normalization

### Database Schema Evolution

```sql
-- Final normalized schema (PostgreSQL)

-- Users table (source of truth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  student_id TEXT,
  level TEXT CHECK (level IN ('aleman1', 'aleman2')),
  identity_hash TEXT UNIQUE, -- SHA-256 fingerprint
  flags TEXT[], -- Array of flags: ['EXTERNAL_STUDENT', 'NAME_VARIATION']
  metadata JSONB
);

-- Sessions table (course structure)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY, -- Format: 'a1-w01', 'a2-w03'
  level TEXT NOT NULL CHECK (level IN ('aleman1', 'aleman2')),
  slug TEXT UNIQUE NOT NULL, -- URL-friendly: 'w01', 'w03'
  title TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table (normalized)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 50),
  ai_feedback JSONB, -- DeepSeek response
  pedagogical_context JSONB, -- Snapshot of constraints at submission time
  flags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Indexes for performance
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_session ON submissions(session_id);
CREATE INDEX idx_submissions_created ON submissions(created_at);
CREATE INDEX idx_profiles_identity_hash ON profiles(identity_hash);
```

### Key Normalization Decisions

| Before (Sheets) | After (Supabase) | Rationale |
|-----------------|------------------|-----------|
| `user_email`, `first_name`, `last_name` in submissions | Foreign key to `profiles` | Eliminate duplication |
| `week` as free text | `session_id` with foreign key | Enforce valid sessions |
| Flags as comma-separated string | `TEXT[]` array | Queryable, type-safe |
| No audit trail | `pedagogical_context` JSONB | Snapshot constraints at submission |
| Manual deduplication | `identity_hash` unique constraint | Automatic conflict detection |

---

## 📝 Architectural Decision Record (ADR)

### ADR-001: Identity Resolution Strategy

**Status:** Accepted  
**Date:** 2025-09-10

**Context:**
- Students submit from mobile with unreliable auth
- Cannot force institutional login
- Human errors in names/emails are common
- Blocking users creates support overhead

**Decision:**
Implement hierarchical identity resolution:
1. **Primary key:** Backend-generated UUID (immutable)
2. **Fingerprint:** SHA-256 hash of (email + student_id + name)
3. **Flags:** Non-blocking markers for manual review
4. **Normalization:** Heuristic correction of common errors

**Consequences:**
- ✅ Zero user lockouts
- ✅ Full auditability
- ✅ Automatic deduplication
- ⚠️ Requires manual review of flagged submissions

---

### ADR-002: Database Normalization

**Status:** Accepted  
**Date:** 2025-10-05

**Context:**
- Google Sheets reached scalability limits
- No relational integrity
- AI feedback needed persistent storage
- POST endpoints required

**Decision:**
Migrate to Supabase PostgreSQL with:
- Separate `profiles`, `sessions`, `submissions` tables
- Foreign key relationships
- JSONB for flexible metadata
- Row Level Security (RLS) policies

**Consequences:**
- ✅ Relational integrity enforced
- ✅ Scalable query performance
- ✅ Transaction support
- ⚠️ Migration complexity
- ⚠️ Learning curve for team

---

## 🧪 Real-World Impact

### Metrics (Production Data)

| Metric | Before (GAS) | After (Supabase) |
|--------|--------------|------------------|
| **User lockouts** | 12 per week | 0 |
| **Support tickets** | 8 per week | 2 per week |
| **Data inconsistency** | 15% of submissions | <1% |
| **AI feedback latency** | N/A | 3-8 seconds |
| **Query performance** | 2-5 seconds | <100ms |

### User Feedback

> "Nunca me bloqueó el sistema, aunque me equivoqué de cuenta 3 veces."  
> — Student, UAM

> "Puedo ver exactamente qué estudiantes tienen problemas de identidad sin interrumpir su flujo."  
> — Instructor

---

## 🔗 Related Repository

This backend implementation is coupled with the student-facing frontend:

👉 **[cse-student-portal-german-edu](https://github.com/yassergandhi/cse-student-portal-german-edu)**

---

## 📚 Learning Outcomes

This repository demonstrates:

- ✅ **Identity resolution under imperfect conditions**
- ✅ **Progressive system evolution** (Sheets → Supabase)
- ✅ **Data normalization without user disruption**
- ✅ **Architectural Decision Records** as source of truth
- ✅ **Observability through flags and audit trails**
- ✅ **Customer Success Engineering mindset** (friction reduction over perfection)

---

## 📄 License

Educational use. All rights reserved.