# AI Development Instructions

Follow these instructions **exactly** for every feature implementation or bug fix. These are mandatory steps that must be completed in order.

---

## Development Workflow

### Step 1: Check the Final Goal
- **Read the final goal document** (if exists: `FINAL_GOAL.md`, `ROADMAP.md`, or similar)
- **Verify if the current feature/task is listed** in the final goal
- **If NOT listed**: Add the feature to the final goal document with:
  - Feature name and description
  - Acceptance criteria
  - Priority level (if applicable)
- **If listed**: Confirm understanding of the requirements and acceptance criteria

### Step 2: Implementation
- **Read existing code** before making changes - NEVER propose changes to code you haven't read
- **Follow existing patterns** and coding conventions in the codebase
- **Keep changes focused** - only implement what was requested, avoid over-engineering
- **Avoid introducing**:
  - Security vulnerabilities (XSS, SQL injection, command injection, etc.)
  - Breaking changes to existing functionality
  - Unnecessary abstractions or premature optimizations
- **Document complex logic** with clear comments (only where the logic isn't self-evident)

### Step 3: Testing
- **Write tests** for the new feature or bug fix:
  - Unit tests for individual functions/components
  - Integration tests if the feature involves multiple components
  - Edge cases and error scenarios
- **Run ALL existing tests** to ensure nothing is broken
- **Verify all tests pass** before proceeding
- **If tests fail**:
  - Fix the implementation or tests
  - Re-run until all tests pass
  - Do NOT proceed to the next step until tests are green

### Step 4: Branch Management & Commit
- **Check current branch**: Run `git branch --show-current`
- **Branch naming convention**: Use descriptive names like `feature/name`, `bugfix/name`, or `refactor/name`

**If on `main` branch**:
1. Create a new branch: `git checkout -b feature/descriptive-name`
2. Stage changes: `git add .`
3. Commit with descriptive message
4. Push to remote: `git push -u origin branch-name`

**If already on a feature branch**:
1. Stage changes: `git add .`
2. Commit with descriptive message
3. Push to remote: `git push`

**CRITICAL**: NEVER commit directly to `main` branch. Always use feature branches.

**Commit Message Format**:
```
<type>: <short summary>

<detailed description of what was done>

- Bullet point 1
- Bullet point 2

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Step 5: Update Handover Document
- **Update or create** `HANDOVER.md` with the following sections:

```markdown
# Handover Document

Last Updated: [DATE]

## Progress Against Final Goal
- [X] Completed Feature 1
- [X] Completed Feature 2
- [ ] In Progress: Feature 3 (70% complete)
- [ ] Pending: Feature 4

## Recent Changes
### [Date] - [Feature/Fix Name]
- **What was done**: Brief description
- **Files changed**: List of modified files
- **Tests added**: Description of test coverage
- **Known issues**: Any limitations or bugs
- **Next steps**: What should be done next

## Technical Details
### Architecture Overview
- Brief description of system architecture
- Key design decisions

### Dependencies
- List of major dependencies
- Version constraints or requirements

### Environment Setup
- Steps to set up development environment
- Required tools and configurations

## Known Issues
- Issue 1: Description and potential impact
- Issue 2: Description and potential impact

## Next Steps
1. Priority 1: Description
2. Priority 2: Description
3. Priority 3: Description
```

---

## After Each Implementation

Always complete these final checks:

1. All tests pass ✓
2. Changes committed to feature branch (NOT main) ✓
3. Handover document updated ✓
4. Code follows existing patterns ✓
5. No security vulnerabilities introduced ✓

---

## Important Reminders

- **Read before editing**: Always read files before modifying them
- **Test before committing**: All tests must pass
- **Never commit to main**: Always use feature branches
- **Keep it simple**: Avoid over-engineering
- **Document clearly**: Update handover doc with relevant details
- **Security first**: Check for common vulnerabilities

---

## File Locations

- Final Goal: `FINAL_GOAL.md` (or similar)
- Handover Doc: `HANDOVER.md`
- Tests: Usually in `test/`, `tests/`, `__tests__/`, or `*.test.*` files
- Branch naming: `feature/*`, `bugfix/*`, `refactor/*`
