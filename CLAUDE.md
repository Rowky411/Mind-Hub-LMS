# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is **SpecKit**, a specification-driven feature development framework that uses custom slash commands to guide the complete lifecycle from feature description to implementation. The workflow enforces structured planning, clarification, and task generation before code is written.

## Core Workflow Commands

SpecKit provides 8 slash commands that should be used in sequence:

### Primary Workflow

1. **`/speckit.specify <description>`** - Create feature specification from natural language
   - Parses user input into structured spec with user stories, requirements, and success criteria
   - Generates validation checklist and may present clarification questions
   - Creates new feature branch and `specs/###-feature-name/spec.md`
   - Output: `spec.md` with business requirements (no implementation details)

2. **`/speckit.clarify`** - Resolve ambiguities in specification (optional but recommended)
   - Asks up to 5 targeted clarification questions interactively
   - Updates spec.md incrementally after each answer
   - Focus: functional scope, data model, edge cases, non-functional requirements
   - Run BEFORE planning to reduce rework

3. **`/speckit.plan`** - Generate implementation plan and design artifacts
   - Creates `plan.md` with tech stack, architecture, project structure
   - Generates Phase 0 `research.md` for technical decisions
   - Generates Phase 1 artifacts: `data-model.md`, `contracts/`, `quickstart.md`
   - Validates against constitution (`.specify/memory/constitution.md`)
   - Output: Complete design documents in feature directory

4. **`/speckit.tasks`** - Generate actionable task list
   - Creates `tasks.md` with dependency-ordered tasks organized by user story
   - Tasks grouped by priority (P1, P2, P3) enabling incremental delivery
   - Marks parallel tasks with `[P]` flag
   - Output: Executable task breakdown ready for implementation

5. **`/speckit.implement`** - Execute implementation plan
   - Checks checklist completion status before starting
   - Processes tasks phase-by-phase following dependencies
   - Creates/verifies ignore files (.gitignore, .dockerignore, etc.)
   - Marks completed tasks in tasks.md as work progresses
   - Follows TDD if tests are included in task list

### Supporting Commands

6. **`/speckit.constitution`** - Create or update project constitution
   - Defines non-negotiable architectural principles
   - Template-based with placeholders for project-specific rules
   - Location: `.specify/memory/constitution.md`

7. **`/speckit.checklist`** - Generate custom validation checklist
   - Creates feature-specific checklists in `specs/###-feature/checklists/`
   - Examples: requirements.md, security.md, ux.md
   - Used by `/speckit.implement` for pre-implementation validation

8. **`/speckit.analyze`** - Cross-artifact consistency analysis (read-only)
   - Validates consistency across spec.md, plan.md, tasks.md
   - Detects: duplication, ambiguity, missing coverage, constitution violations
   - Outputs structured report with severity ratings
   - Run after `/speckit.tasks` before implementation

## Directory Structure

```
specs/
└── ###-feature-name/          # One directory per feature
    ├── spec.md                # Business requirements (what/why)
    ├── plan.md                # Technical design (architecture/stack)
    ├── tasks.md               # Executable task list
    ├── research.md            # Technical decisions and rationale
    ├── data-model.md          # Entities and relationships
    ├── quickstart.md          # Integration scenarios
    ├── contracts/             # API specs (OpenAPI/GraphQL)
    └── checklists/            # Validation checklists

.specify/
├── memory/
│   └── constitution.md        # Project principles (non-negotiable)
├── templates/                 # Templates for all artifacts
│   ├── spec-template.md
│   ├── plan-template.md
│   ├── tasks-template.md
│   ├── checklist-template.md
│   └── agent-file-template.md
└── scripts/powershell/        # Workflow automation scripts
    ├── create-new-feature.ps1
    ├── setup-plan.ps1
    ├── check-prerequisites.ps1
    ├── update-agent-context.ps1
    └── common.ps1

.claude/commands/              # Slash command definitions
├── speckit.specify.md
├── speckit.clarify.md
├── speckit.plan.md
├── speckit.tasks.md
├── speckit.implement.md
├── speckit.constitution.md
├── speckit.checklist.md
└── speckit.analyze.md
```

## Key Concepts

### Feature Branch Model
- Each feature gets a numbered branch: `###-feature-name` (e.g., `001-user-auth`)
- Branch created automatically during `/speckit.specify`
- All artifacts stored in `specs/###-feature-name/`

### User Story Organization
- Specifications prioritize user stories (P1, P2, P3...)
- Each story must be independently testable and deliverable
- Tasks are organized by user story for incremental implementation
- P1 story = MVP, additional stories add incremental value

### Constitution-Driven Development
- `.specify/memory/constitution.md` defines non-negotiable principles
- `/speckit.plan` validates against constitution before proceeding
- Constitution violations must be justified or resolved
- Examples: TDD requirements, library-first architecture, CLI interfaces

### Phase-Based Task Execution
1. **Setup** - Project initialization
2. **Foundational** - Blocking prerequisites for all stories
3. **User Stories** - One phase per story (P1, P2, P3...)
4. **Polish** - Cross-cutting concerns

### Test-First Approach (Optional)
- Tests only generated if explicitly requested in spec
- When included: write tests → verify they fail → implement → verify pass
- Test types: contract tests, integration tests, unit tests

## PowerShell Script Usage

All workflow scripts must be run from repository root:

```bash
# Create new feature (returns JSON with BRANCH_NAME, SPEC_FILE)
.specify/scripts/powershell/create-new-feature.ps1 -Json "user authentication"

# Setup planning phase (returns FEATURE_SPEC, IMPL_PLAN, etc.)
.specify/scripts/powershell/setup-plan.ps1 -Json

# Check prerequisites (returns FEATURE_DIR, AVAILABLE_DOCS)
.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks

# Update agent context after design phase
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

**Important**: When passing arguments with single quotes (e.g., "I'm ready"), use escape syntax: `'I'\''m ready'` or use double quotes: `"I'm ready"`

## Workflow Best Practices

### Starting a New Feature
1. Run `/speckit.specify` with clear feature description
2. Answer clarification questions if presented
3. Review generated spec.md for accuracy
4. Optionally run `/speckit.clarify` for additional refinement
5. Run `/speckit.plan` to generate technical design
6. Run `/speckit.tasks` to create task breakdown
7. Optionally run `/speckit.analyze` to validate consistency
8. Run `/speckit.implement` to execute implementation

### When to Use Each Command
- **specify**: Start every new feature
- **clarify**: High-impact features with unclear requirements
- **plan**: Required after specification is stable
- **tasks**: Required after plan is complete
- **implement**: Execute only after tasks are validated
- **constitution**: Project initialization or principle updates
- **checklist**: Custom validation needs beyond standard checks
- **analyze**: Large/complex features before implementation

### Avoiding Common Pitfalls
- Never skip `/speckit.specify` - it initializes the feature structure
- Don't run `/speckit.plan` before spec is stable (reduces rework)
- Don't modify templates directly - they're shared across features
- Always run scripts from repo root for correct path resolution
- Read script JSON output rather than re-running (scripts have side effects)

## Template Philosophy

### Spec Template
- Business-focused: WHAT users need and WHY
- Technology-agnostic: No frameworks, languages, or APIs
- Testable requirements with measurable success criteria
- Maximum 3 `[NEEDS CLARIFICATION]` markers (use informed defaults)

### Plan Template
- Technical decisions: HOW to implement
- Documents tech stack, architecture, project structure
- Includes constitution check validation
- References research.md for decision rationale

### Tasks Template
- Executable breakdown with exact file paths
- Organized by user story for independent delivery
- Parallel markers `[P]` for concurrent execution
- Clear dependencies and checkpoints

## Special Features

### Incremental Clarification
`/speckit.clarify` asks questions one at a time and updates spec.md after each answer. Presents recommended answers based on best practices.

### Checklist Validation
`/speckit.implement` checks all checklists in `checklists/` directory before starting implementation. Prompts user if incomplete items exist.

### Parallel Task Detection
Tasks modifying different files can run in parallel. Marked with `[P]` flag in tasks.md.

### Agent Context Updates
After generating design artifacts, run `update-agent-context.ps1` to add technology context to Claude's memory.

## Windows Platform Notes

This repository uses PowerShell scripts optimized for Windows:
- Use `pwsh` or PowerShell 7+ for best compatibility
- Scripts handle git and non-git repositories
- Path resolution works with both forward and backslashes
- JSON output mode for script-to-agent communication
