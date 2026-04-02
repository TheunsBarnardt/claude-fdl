# FDL Auto-Evolve — Skill

Auto-validate, generate docs, and commit blueprint changes in a single operation.

## Description

When blueprints are created or modified, this skill automatically:
1. **Validates** all blueprints against the schema
2. **Generates** documentation and JSON API
3. **Commits** changes with proper messaging
4. **Tracks** improvements with version bumps
5. **Reports** what changed and why

This turns FDL from a manual process into an evolving system that improves automatically.

## Trigger Points

Run this skill after:
- Extracting blueprints from code (`/fdl-extract-code`)
- Creating new blueprints (`/fdl-create`)
- Improving existing blueprints (via edit)
- Any `blueprints/` directory changes

## Usage

```
/fdl-auto-evolve
/fdl-auto-evolve --dry-run     # Preview changes without committing
/fdl-auto-evolve --verbose     # Show detailed validation output
```

## What It Does

### Step 1: Validate
```bash
node scripts/validate.js
```
- Validates all blueprints against schema
- Detects cross-reference errors
- Reports warnings for missing features
- Fails fast if any blueprint is invalid

### Step 2: Generate Docs
```bash
npm run generate
```
- Regenerates `docs/blueprints/**/*.md`
- Regenerates `docs/api/**/*.json`
- Updates `registry.json` with all features
- Keeps docs always in sync with blueprints

### Step 3: Detect Changes
- Compare git index before/after validate/generate
- Identify which blueprints changed
- Calculate version bumps (patch/minor/major)
- Summarize improvements

### Step 4: Commit
- Stage all validated changes
- Generate commit message with:
  - List of updated blueprints
  - Summary of improvements
  - Version updates
- Create atomic commit (all-or-nothing)

### Step 5: Report
- Show user what changed
- List new features
- Highlight improvements
- Suggest next steps

## Exit Codes

- **0** — Success: blueprints valid, docs generated, commit created
- **1** — Validation failed: fix blueprints and retry
- **2** — User cancelled (dry-run mode)
- **3** — Git/workspace error: clean up and retry

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FDL AUTO-EVOLVE — Blueprint Evolution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ VALIDATION       [51/51 blueprints passed]
✓ DOCUMENTATION   [23 pages generated]
✓ CHANGES DETECTED [3 blueprints updated]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPDATED BLUEPRINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 auth/login (v1.0.0 → v1.1.0)
   • Added OAuth/social login outcomes
   • Enhanced session management with refresh tokens
   • Improved timing-attack mitigation docs

📝 auth/session-management (NEW)
   • Token refresh strategies (compact, JWT, JWE)
   • Device tracking and session isolation
   • Auto-refresh configuration

📝 auth/two-factor-authentication (IMPROVED)
   • TOTP + backup codes with trusted devices
   • Rate limiting and recovery procedures
   • Integration with existing login flow

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMIT CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Commit: abc1234
   Extract auth features from better-auth codebase

   • Enhanced login with OAuth and device tracking
   • Added session management with token refresh
   • Added two-factor authentication with TOTP

   All blueprints validated, docs generated, API updated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Ready to push: git push origin main
```

## Integration with Other Skills

- **fdl-extract-code**: Automatically runs `/fdl-auto-evolve` after extraction
- **fdl-create**: Automatically runs `/fdl-auto-evolve` after blueprint creation
- **fdl-generate**: Manually trigger `/fdl-auto-evolve` for docs updates

## Implementation Notes

- Uses `git diff` to detect changes (fast, efficient)
- Creates single atomic commit (no partial states)
- Fails validation = no commit (safety first)
- Dry-run mode for preview without side effects
- Idempotent: safe to run multiple times

## What Makes FDL "Evolving"

This skill transforms FDL from a static repository into an **adapting system**:

1. **Automatic Validation** — Ensures quality gates are always met
2. **Automatic Documentation** — Docs are never out of sync
3. **Atomic Commits** — All-or-nothing changes (no partial states)
4. **Change Tracking** — Knows what improved and why
5. **Integration** — Other skills trigger evolution automatically

Result: Every improvement (from extraction, creation, or manual edits) **automatically propagates** through validation → documentation → version tracking → commit.

## Future Enhancements

- [ ] Semantic versioning based on changes
- [ ] Blueprint diff reports (what changed between versions)
- [ ] Dependency resolution (auto-detect related features)
- [ ] Migration guides for API-breaking changes
- [ ] Changelog auto-generation from commits
- [ ] Integration with CI/CD for automated releases
