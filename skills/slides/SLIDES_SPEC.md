# SLIDES_SPEC (SSOT) v1.0

## Purpose
Generate consistent, business-grade slide decks with controlled style, structure, and evidence.

## Inputs (required)
- topic: string
- audience: string (e.g., investors, staff, customers, students)
- goal: string (persuade | educate | report | pitch)
- duration_min: number (e.g., 5, 10, 20)
- tone: string (executive | technical | friendly | academic)
- constraints: list (optional) (e.g., "no stock photos", "no faces", "cite sources")

## Outputs (required)
- deck_file: .pptx OR .pdf
- outline_file: outline.md
- evidence_pack:
  - sources.md (bullets + links)
  - image_attribution.md (per slide)
  - build_log.md (tool calls + decisions)

## Slide Count Rule (deterministic)
- default slides = clamp( duration_min * 1.0 , min=6, max=18 )
- if goal == pitch: clamp(duration_min * 0.8, 6, 14)
- if goal == educate: clamp(duration_min * 1.2, 8, 20)
(Always round to nearest integer.)

## Structure Templates (choose exactly one)
### A) Executive Brief
1 Cover
2 Agenda
3 Problem/Context
4 What is it / Definition
5 Market/Users
6 Solution
7 Benefits/Impact
8 Risks/Challenges
9 Next Steps
10 Conclusion

### B) Education Explainer
1 Cover
2 What is it
3 Why it matters
4 How it works
5 Timeline/History (optional)
6 Use cases
7 Risks/Ethics
8 Future
9 Summary
10 Q&A

### C) Data Report
1 Cover
2 Key findings
3 Method
4 Metrics (charts)
5 Segment analysis
6 Risks
7 Recommendations
8 Appendix

## Visual Rules (hard constraints)
- one idea per slide
- max 6 bullets per slide
- bullets: max 12 words each
- use no more than 2 fonts
- images must be relevant; avoid decorative filler
- if using web sources: include citations in sources.md

## Safety/Legal
- Do not include copyrighted images unless licensed/explicitly permitted.
- Prefer: user-provided assets, public-domain, or properly licensed (e.g., Unsplash/Pexels) + attribution.
- If license unclear: do not use image.

## Style Modes (select one)
- "Mono+Red" (default): monochrome + single accent color
- "Corporate Blue"
- "Minimal White"
(Style tokens defined in STYLE_TOKENS.json)

## Pass/Fail Criteria
A deck PASSES only if:
- slide count matches rule +-1 (only if template forces it)
- outline matches actual slides (titles + order)
- every claim that is non-obvious has a source in sources.md
- images have attribution or are marked "user-provided"
- QUALITY_GATES.md all pass
