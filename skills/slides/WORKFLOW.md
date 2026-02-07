# WORKFLOW — Slides Skill v1.0

## Step 0 — Intake
- Validate required inputs.
- Compute slide_count from SLIDES_SPEC.
- Select template (Executive Brief / Education Explainer / Data Report) based on goal + audience.

## Step 1 — Research (if needed)
- If user provides sources: use them only.
- Else: web research for 5-10 credible sources.
- Produce: sources.md with bullet claims + citations.

## Step 2 — Outline
- Draft slide titles + 1-sentence takeaway each.
- Enforce: one idea per slide, max 6 bullets.
- Produce: outline.md.

## Step 3 — Visual planning
- For each slide choose ONE:
  - hero image
  - simple icon row
  - chart (if data)
- Record in image_attribution.md (even before retrieval).

## Step 4 — Build deck
- Apply STYLE_TOKENS.json
- Create slides from outline
- Insert visuals per plan

## Step 5 — Quality gates
- Run QUALITY_GATES checklist.
- Fix failures (max 2 revision loops).
- Log changes in build_log.md.

## Step 6 — Export + Evidence
- Export final deck
- Save: outline.md, sources.md, image_attribution.md, build_log.md into evidence/
