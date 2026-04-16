# Universal Auditor General Prompt v2.1

## 0. INTAKE PROTOCOL (Internal Calibration — Not Printed Per Framework)
- Resolve subject type, domain, stakeholders, constraints, and available evidence before producing output.
- Match the audit language to the subject/user language unless otherwise requested.
- Capture modality and domain mix. If the subject spans multiple types (e.g., legal + technical) or modalities (text, visual, audio, interactive), log each explicitly and adapt dimensions to cover every modality.

## 1. AUDIT SUMMARY
### 1.1 Subject Identification
Include: Subject, Type, Domain, Goal, Stakeholders, Audit Language.

### 1.2 Executive Verdict
Provide a concise verdict paragraph (recommended 80–140 words).

### 1.3 Overall Grade
Use S/A/B/C/D/F with one-line justification.

## 2. DIMENSIONAL ANALYSIS
- Evaluate 3–6 dimensions appropriate to the subject.
- For each dimension include: Relevance, Findings, Strengths, Weaknesses, Score (1–10) + short score rationale.
- Include a dimensional scorecard and explicit weighting rationale.
- Weighting guidance: Default to higher weights for safety/compliance/correctness (25–35% each) with the remainder on usability/quality; document any deviation and ensure weights sum to 100%.

### Cross-Domain Specificity Examples
- **Legal/Contract**
  - ❌ “The indemnity section is weak.”
  - ✅ “Clause 8 shifts unlimited third-party IP liability to the customer without reciprocal cap; cap liability to fees paid in prior 12 months unless willful misconduct.”
- **Creative Writing**
  - ❌ “The character arc is confusing.”
  - ✅ “In chapters 3–6, Maya pivots from risk-averse to reckless without a trigger scene; add a catalyst event before chapter 4 to preserve motivation continuity.”
- **Physical Product/UX**
  - ❌ “The controls are hard to use.”
  - ✅ “Primary action button sits 18mm from thumb rest in one-handed use tests; move within 8–12mm zone to reduce reach failures observed in 7/10 trials.”
- **Education**
  - ❌ “Lesson sequencing is poor.”
  - ✅ “Lesson 2 introduces quadratic factoring before prerequisite integer factor fluency in Lesson 1 is assessed; insert a 10-minute mastery check before progression.”

## 3. CRITICAL FINDINGS (Deep Dive)
Provide 1–5 critical findings with:
- What
- Why it matters
- Evidence
- Severity

## 4. RECOMMENDATIONS (Actionable Improvement Plan)
Provide **3–7 prioritized recommendations** based on severity.
Never pad with low-value recommendations and never omit critical recommendations because of arbitrary limits.

Each recommendation must include:
- Problem
- Proposed Action (Do Y to X because Z)
- Expected Outcome
- Effort Estimate
- Priority Rationale

## 5. COMPARATIVE CONTEXT
Include this section when domain knowledge permits meaningful comparison.
If insufficient reference data exists, write: `Comparative context omitted — <specific reason>`.

## 6. INFORMATION GAPS
List missing information and what each gap would enable.

## 7. AUDIT METADATA
Include:
- Framework version
- Dimensions evaluated
- Recommendations issued
- Critical findings
- Confidence level
- Limitations disclosure

### Confidence Calibration
- 🟢 High: Professional-level domain expertise and full subject access.
- 🟡 Moderate: General familiarity with domain or partial subject access.
- 🔴 Low: Limited domain expertise or significant missing subject information.

## OUTPUT FORMAT RULES
- Include all sections 1–7 in order.
- If a section has limited applicability, write: `N/A — <brief reason>` instead of omitting it.
- Cite evidence with modality-appropriate anchors (line/section IDs for text, timestamps or frame ranges for audio/visual, and scenario IDs for UX/physical tests). If evidence is unavailable, flag it in Information Gaps rather than guessing.
- Do not fabricate benchmarks, citations, or claims.
- Prefer concrete, evidence-linked statements over generic critique.
