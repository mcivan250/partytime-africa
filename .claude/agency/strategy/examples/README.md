# Examples

> **Claude Code note:** "Activate X" means: ask the main session to delegate to that subagent (e.g. *"Use the ux-researcher agent to …"*). The main session is the orchestrator; subagents can't call each other.
> Installed names: Book Co-Author → `book-co-author`, Content Creator → `content-creator`, UI Designer → `ui-designer`, UX Researcher → `ux-researcher`, Sprint Prioritizer → `product-sprint-prioritizer`, Product Trend Researcher → `product-trend-researcher`, Brand Guardian → `brand-guardian`, Project Shepherd → `project-management-project-shepherd`, Reality Checker → `testing-reality-checker`, XR Interface Architect → `xr-interface-architect`, Support Responder → `support-support-responder`.
> Not installed yet (not uploaded): Backend Architect, Frontend Developer, Rapid Prototyper, Growth Hacker. Use the general-purpose agent until they arrive.

This directory contains example outputs demonstrating how the agency's agents can be orchestrated together to tackle real-world tasks.

## Why This Exists

The agency-agents repo defines dozens of specialized agents across engineering, design, marketing, product, support, spatial computing, and project management. But agent definitions alone don't show what happens when you **deploy them all at once** on a single mission.

These examples answer the question: *"What does it actually look like when the full agency collaborates?"*

## Contents

### [nexus-spatial-discovery.md](./nexus-spatial-discovery.md)

**What:** A complete product discovery exercise where 8 agents worked in parallel to evaluate a software opportunity and produce a unified plan.

**The scenario:** Web research identified an opportunity at the intersection of AI agent orchestration and spatial computing. The entire agency was then deployed simultaneously to produce:

- Market validation and competitive analysis
- Technical architecture (8-service system design with full SQL schema)
- Brand strategy and visual identity
- Go-to-market and growth plan
- Customer support operations blueprint
- UX research plan with personas and journey maps
- 35-week project execution plan with 65 sprint tickets
- Spatial interface architecture specification

**Agents used:**
| Agent | Role |
|-------|------|
| Product Trend Researcher | Market validation, competitive landscape |
| Backend Architect | System architecture, data model, API design |
| Brand Guardian | Positioning, visual identity, naming |
| Growth Hacker | GTM strategy, pricing, launch plan |
| Support Responder | Support tiers, onboarding, community |
| UX Researcher | Personas, journey maps, design principles |
| Project Shepherd | Phase plan, sprints, risk register |
| XR Interface Architect | Spatial UI specification |

**Key takeaway:** All 8 agents ran in parallel and produced coherent, cross-referencing plans without coordination overhead. The output demonstrates the agency's ability to go from "find an opportunity" to "here's the full blueprint" in a single session.

## Adding New Examples

If you run an interesting multi-agent exercise, consider adding it here. Good examples show:

- Multiple agents collaborating on a shared objective
- The breadth of the agency's capabilities
- Real-world applicability of the agent definitions
