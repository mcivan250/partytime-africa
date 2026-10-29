# Agency: AI specialist team

`.claude/agents/` holds 180 Claude Code subagents (engineering, testing, product,
marketing, sales, finance, support, GIS, healthcare, spatial computing, and more),
adapted from the agency-agents collection with fixes and approval gates added.

Use one by name in a session on this repo, e.g. *"Use the testing-reality-checker
agent to review the web build."* The main session acts as orchestrator; subagents
can't call each other.

- `strategy/`: NEXUS playbooks, runbooks, handoff templates, worked examples
- `strategy/tools/qa-capture.mjs`: Playwright screenshot + test-results capture
- `world-bible.md`: shared memory for the worldbuilding agents

Agents draft and recommend; anything outward-facing (payments, publishing,
production changes, filings) needs explicit human approval.
