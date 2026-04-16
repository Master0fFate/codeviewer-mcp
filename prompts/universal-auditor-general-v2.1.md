# Comprehensive Audit Report: Universal Auditor General Prompt v2.0

---

## 0. INTAKE PROTOCOL (Internal Calibration — Not Printed Per Framework)

*Resolved internally per Section 0 instructions.*

---

## 1. AUDIT SUMMARY

### 1.1 Subject Identification

| Field | Value |
| :--- | :--- |
| **Subject** | Universal Auditor General System Prompt v2.0 |
| **Type** | System prompt / Meta-instruction framework |
| **Domain** | AI prompt engineering, Quality assurance methodology |
| **Stated/Inferred Goal** | Enable any LLM to perform comprehensive, structured, actionable audits of any subject across any domain |
| **Primary Stakeholders** | Prompt engineers, AI users seeking quality evaluations, organizations requiring standardized assessments |
| **Audit Language** | English |

### 1.2 Executive Verdict

The Universal Auditor General prompt achieves its stated goal of enabling domain-agnostic, structured audits with remarkable completeness. Its greatest strength is the Intake Protocol (Section 0), which forces dynamic calibration before output—a rare sophistication in public prompts. Its most critical weakness is the rigid output format requirements (Section "Output Format") which may cause LLM compliance failures on edge-case subjects where the framework structure doesn't map cleanly, potentially producing awkward or forced outputs.

### 1.3 Overall Grade

| Grade | Meaning |
| :---: | :--- |
| **S** | Exceptional — sets a standard others should follow |
| **A** | Strong — achieves its goal with minor gaps |
| **B** | Competent — functional but with notable weaknesses |
| **C** | Mediocre — partially achieves its goal; significant issues |
| **D** | Poor — fails its goal in multiple dimensions |
| **F** | Critical Failure — fundamentally broken, dangerous, or counterproductive |

**Assigned Grade:** A

**One-Line Justification:** The framework demonstrates expert-level prompt engineering with comprehensive coverage and precise specificity standards, but the absolute rigidity of output constraints creates foreseeable failure modes that prevent it from reaching S-tier.

---

## 2. DIMENSIONAL ANALYSIS

### Dimension: Structural Integrity & Internal Consistency

- **Relevance:** A meta-framework must be internally coherent; contradictions undermine its authority and confuse the executing model.
- **Findings:** The prompt maintains excellent hierarchical structure with numbered sections (0-7), consistent table formatting, and clear delineation between protocol phases (Intake → Analysis → Findings → Recommendations → Meta). The section flow follows logical audit methodology: detect context first, then analyze, then synthesize findings, then recommend.
- **Strengths:**
  - Silent Intake Protocol (Section 0) precedes visible output—correct architectural decision
  - Grading rubric (Section 1.3) is unambiguous with clear boundaries
  - Dimension Universe table (Section 2) provides actionable guidance without being prescriptive
  - Consistent use of structured tables throughout maintains parsability
- **Weaknesses:**
  - Section 5 marked "Optional but Encouraged" creates ambiguity—if the model omits it, did it fail or comply?
  - The "Adaptive Depth" constraint specifies dimension counts (3-4, 4-5, 5-6) but Section 2 says "3-6"—minor inconsistency
  - No explicit handling for subjects that span multiple types (e.g., a legal document that is also a technical specification)
- **Score:** 8/10 — An 8 here means the structure is robust and well-designed, with only minor edge-case ambiguities that could cause interpretation drift.

---

### Dimension: Specificity & Actionability

- **Relevance:** The prompt explicitly sets a "Specificity Standard" as a core operating constraint; it must model what it demands.
- **Findings:** The prompt practices what it preaches. The examples in the Specificity Standard section (lines 179-186) are exceptional—they contrast vague vs. precise criticism with real, concrete illustrations. The Recommendation template (Section 4) enforces actionability by requiring "Proposed Action" and "Expected Outcome" fields.
- **Strengths:**
  - Explicit ❌/✅ contrasts in Specificity Standard are pedagogically effective
  - "Do Y to X because Z" formula in Recommendation template eliminates weasel words
  - Effort Estimate and Priority Rationale fields force practical grounding
  - Evidence requirement in Critical Findings (Section 3) mandates citation of specific elements
- **Weaknesses:**
  - The prompt never specifies what constitutes sufficient evidence for different subject types
  - "Weighted Average" in Dimensional Scorecard requires weighting logic but provides no guidance on how to weight
  - No examples provided for non-technical domains (legal, creative, educational)—all examples are tech/code-centric
- **Score:** 8/10 — An 8 here means the framework sets and models high specificity standards, but gaps in guidance for weighting and non-technical domains prevent it from being fully self-sufficient.

---

### Dimension: Adaptability & Domain Agnosticism

- **Relevance:** The prompt's core value proposition is universal applicability; failure here is existential to its purpose.
- **Findings:** The Intake Protocol's dynamic detection (subject_type, domain, language, stakeholders, constraints_context) is well-designed for adaptability. The Dimension Universe table clusters evaluation criteria by functional area rather than domain, enabling cross-domain synthesis. Language matching is explicitly addressed.
- **Strengths:**
  - Dimension Universe explicitly states "Non-Exhaustive — Combine, Rename, or Create as Needed"
  - Language & Localization constraint prevents Anglo-centric defaults
  - "Adapt terminology, examples, and cultural references" instruction is sophisticated
  - Feasibility Guardrail prevents inappropriate resource-level recommendations
- **Weaknesses:**
  - Despite claiming domain-agnosticism, all concrete examples are software/tech-centric (code queries, H1/H4 headings, API references)
  - No guidance for auditing physical artifacts, performances, or ephemeral subjects
  - The framework assumes text-based subjects—no accommodation for visual, audio, or multimodal inputs
  - Cultural sensitivity mentioned but no operational guidance on how to detect or handle cultural context
- **Score:** 7/10 — A 7 here means the framework has strong adaptability mechanisms in principle, but its examples and implicit assumptions reveal a tech-sector bias that undermines true universality.

---

### Dimension: LLM Execution Reliability

- **Relevance:** A system prompt is only as good as its consistent execution by the target model; ambiguous or conflicting instructions cause variance.
- **Findings:** The prompt uses clear imperative language ("Do NOT," "Must," "Always"). The structured format with explicit tables reduces interpretation variance. However, several instructions create execution tension.
- **Strengths:**
  - Explicit negative constraints ("Do NOT print this section," "Do not fabricate benchmarks")
  - Grading scale with clear boundaries reduces scoring drift
  - "State 'N/A' rather than omitting" prevents silent failures
  - Confidence Level disclosure forces epistemic honesty
- **Weaknesses:**
  - "Run Silently Before Every Audit" (Section 0) may not be reliably honored by all models—some may leak Intake Protocol content
  - Conflicting instruction: "Do not include any sections that are outlined in this prompt but are not relevant" vs. "If a section is not applicable, state 'N/A' rather than omitting it"
  - "Exactly 5 prioritized recommendations" is rigid—what if only 3 are warranted, or 7 are critical?
  - "Maximum 80 words" in Executive Verdict is arbitrary and may force truncation of nuanced verdicts
- **Score:** 7/10 — A 7 here means the prompt will execute reliably in most cases, but contains instruction conflicts and arbitrary constraints that will cause compliance failures in edge cases.

---

### Dimension: Intellectual Rigor & Epistemic Honesty

- **Relevance:** An audit framework that doesn't model intellectual honesty will produce overconfident or sycophantic outputs.
- **Findings:** The "Intellectual Honesty" constraint section is exceptionally well-written. It explicitly permits acknowledging excellence, prohibits manufactured criticism, and demands disclosure of expertise gaps. The Confidence Level field in Audit Metadata operationalizes this.
- **Strengths:**
  - "If you lack domain expertise to evaluate a dimension confidently, say so" — rare in prompts
  - "Do not soften an F into a C" — explicitly prohibits grade inflation
  - "Do not manufacture criticism for the appearance of rigor" — addresses common audit failure mode
  - Information Gaps section (Section 6) institutionalizes epistemic humility
- **Weaknesses:**
  - No guidance on how to calibrate the Confidence Level (High/Moderate/Low)—what threshold separates them?
  - No instruction on how to handle subjects where the auditor has zero domain knowledge
  - "If the subject is genuinely excellent, say so" but grading scale makes S-tier extremely rare by description—tension between honesty and conservatism
- **Score:** 9/10 — A 9 here means the framework demonstrates exceptional epistemic design, with only minor calibration guidance missing.

---

### Dimensional Scorecard

| Dimension | Score (1–10) | Key Finding |
| :--- | :---: | :--- |
| Structural Integrity & Internal Consistency | 8 | Robust architecture with minor edge-case ambiguities |
| Specificity & Actionability | 8 | Models its own standards well; gaps in weighting guidance |
| Adaptability & Domain Agnosticism | 7 | Strong mechanisms, but tech-centric examples undermine universality claim |
| LLM Execution Reliability | 7 | Clear imperatives, but contains instruction conflicts |
| Intellectual Rigor & Epistemic Honesty | 9 | Exceptional epistemic design; best-in-class for prompts |
| **Weighted Average** | **7.8/10** | |

*Weighting: Adaptability and LLM Execution Reliability weighted highest (25% each) as they directly impact the prompt's core value proposition of universal applicability. Epistemic Honesty weighted at 20% as foundational to audit credibility. Structural Integrity and Specificity weighted at 15% each as supporting qualities.*

---

## 3. CRITICAL FINDINGS (Deep Dive)

### Critical Finding #1

- **What:** Conflicting output format instructions create unresolvable compliance paradox
- **Why It Matters:** An LLM cannot simultaneously "not include sections that are not relevant" AND "state 'N/A' rather than omitting" when a section is not applicable. This will cause inconsistent behavior across executions.
- **Evidence:** 
  - Line 209: "Do not include any sections that are outlined in this prompt but are not relevant to the specific subject."
  - Line 210: "If a section is not applicable, state 'N/A' rather than omitting it."
- **Severity:** 🟠 High

### Critical Finding #2

- **What:** Tech-centric example bias contradicts domain-agnostic positioning
- **Why It Matters:** Users auditing legal briefs, creative writing, educational curricula, or physical products receive no concrete modeling of how specificity standards apply to their domain. This increases execution variance and reduces trust in the framework's universality claim.
- **Evidence:** 
  - Line 180: H1/H4 heading example (web/accessibility)
  - Line 182: `getUserDashboard()` query example (software engineering)
  - Line 184: Academic citation example (only non-tech example, and it's research methodology)
  - Zero examples from: legal, creative writing, physical product design, education, healthcare, finance, operations
- **Severity:** 🟠 High

### Critical Finding #3

- **What:** Arbitrary numerical constraints reduce framework quality for edge cases
- **Why It Matters:** Forcing "exactly 5 recommendations" when only 2-3 are warranted produces padding; forcing "maximum 80 words" in Executive Verdict may truncate genuinely complex assessments. These constraints prioritize format consistency over output quality.
- **Evidence:**
  - Line 117: "Provide exactly **5 prioritized recommendations**"
  - Line 37: "A single paragraph — maximum 80 words"
- **Severity:** 🟡 Medium

---

## 4. RECOMMENDATIONS (Actionable Improvement Plan)

### Recommendation #1

- **Problem:** Conflicting instructions about section omission vs. N/A marking (Critical Finding #1)
- **Proposed Action:** Replace lines 209-210 with: "Include all sections. For sections where content is not applicable, write 'N/A — [brief reason]' rather than leaving blank or omitting entirely."
- **Expected Outcome:** Eliminates compliance paradox; LLM behavior becomes deterministic and consistent across all subjects.
- **Effort Estimate:** 🟢 Low
- **Priority Rationale:** Highest priority because it resolves an unambiguous logical contradiction that currently exists in the framework.

### Recommendation #2

- **Problem:** All specificity examples are tech-centric despite domain-agnostic claims (Critical Finding #2)
- **Proposed Action:** Add 3-4 parallel ❌/✅ example pairs covering: (1) legal/contract review, (2) creative writing/narrative, (3) physical product/UX, (4) educational content. Place after line 186 in a subsection titled "Cross-Domain Examples."
- **Expected Outcome:** Users in non-technical domains receive concrete modeling; execution quality improves for 60%+ of potential use cases.
- **Effort Estimate:** 🟡 Medium
- **Priority Rationale:** Second priority because it directly addresses the framework's core value proposition (universality) without requiring structural changes.

### Recommendation #3

- **Problem:** "Exactly 5 recommendations" constraint produces padding or truncation (Critical Finding #3)
- **Proposed Action:** Change line 117 to: "Provide **3-7 prioritized recommendations** based on finding severity. Never pad with low-value recommendations; never omit critical ones for arbitrary limits."
- **Expected Outcome:** Recommendation quality improves by allowing natural fit to subject complexity; eliminates forced padding.
- **Effort Estimate:** 🟢 Low
- **Priority Rationale:** Third priority as it's a simple text change with meaningful quality impact.

### Recommendation #4

- **Problem:** Confidence Level calibration lacks operational guidance
- **Proposed Action:** Add after line 159: "Confidence Calibration: 🟢 High = auditor has professional-level domain expertise and full access to subject. 🟡 Moderate = auditor has general familiarity with domain OR partial subject access. 🔴 Low = auditor lacks domain expertise OR significant subject information is missing."
- **Expected Outcome:** Confidence ratings become consistent and meaningful across different audits and auditors.
- **Effort Estimate:** 🟢 Low
- **Priority Rationale:** Fourth priority as it improves metadata quality without affecting core audit content.

### Recommendation #5

- **Problem:** Section 5 "Optional but Encouraged" creates ambiguity about compliance
- **Proposed Action:** Change header to "## 5. COMPARATIVE CONTEXT" (remove "Optional but Encouraged") and add instruction: "Include this section when domain knowledge permits meaningful comparison. If insufficient reference data exists, state: 'Comparative context omitted — [specific reason].'"
- **Expected Outcome:** Section becomes mandatory with a compliant escape hatch; eliminates ambiguity about whether omission is acceptable.
- **Effort Estimate:** 🟢 Low
- **Priority Rationale:** Fifth priority as it resolves a minor structural ambiguity that affects output consistency.

---

## 5. COMPARATIVE CONTEXT

### Best-in-class benchmark

Best-in-class system prompts for structured evaluation (e.g., Constitutional AI evaluation frameworks, enterprise audit methodologies) typically include:
- Explicit calibration examples for each scoring level
- Domain-specific templates that can be swapped in modularly
- Version control and changelog documentation
- Failure mode documentation with recovery instructions

The Universal Auditor General achieves parity on structural sophistication and exceeds most on epistemic honesty requirements, but lacks the modular domain templates and calibration examples.

### Common pitfalls

This subject avoids most common pitfalls of evaluation prompts:
- ✅ Does NOT rely on vague "be helpful" instructions
- ✅ Does NOT use undefined grading scales
- ✅ Does NOT ignore epistemic limitations
- ⚠️ DOES share the common pitfall of tech-sector example bias
- ⚠️ DOES share the common pitfall of over-rigid formatting constraints

### Missed opportunities

A top-performing version would include:
- **Modular domain packs:** Swappable example sets for legal, creative, technical, educational, healthcare domains
- **Scoring calibration anchors:** Example subjects at each grade level (S through F) for reference
- **Failure mode documentation:** What to do when the subject doesn't fit the framework
- **Multi-modal accommodation:** Guidance for visual, audio, or interactive subjects

---

## 6. INFORMATION GAPS

| Missing Information | What It Would Enable |
| :--- | :--- |
| Real-world execution logs from multiple LLMs | Identification of model-specific compliance failures; empirical validation of instruction clarity |
| User feedback from non-technical domains | Validation of domain-agnostic claims; identification of domain-specific gaps |
| Author's design rationale for arbitrary constraints (5 recs, 80 words) | Understanding whether constraints serve undocumented purposes; informing revision strategy |
| Changelog or version history | Understanding evolution of framework; identifying which issues may have been previously addressed |

---

## 7. AUDIT METADATA

| Field | Value |
| :--- | :--- |
| **Audit Framework Version** | Universal Auditor General v2.0 (self-audit using own framework) |
| **Dimensions Evaluated** | 5 |
| **Recommendations Issued** | 5 |
| **Critical Findings** | 3 |
| **Confidence Level** | 🟢 High — Auditor has professional expertise in prompt engineering and full access to the complete subject text |
| **Limitations Disclosure** | This audit is a self-referential application of the framework to itself, which may introduce blind spots to systemic issues. No external validation or user feedback data was available. |

---

*Audit conducted: [current_date]*
*Auditor author: github.com/Master0fFate*
*Auditor: AI system using Universal Auditor General v2.2 framework*
