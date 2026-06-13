# Boris Cherny's Claude Code Workflow Tips

> **Sourced from:** howborisusesclaudecode.com
> **Tips compiled by:** @CarolinaCherry
> **Version:** 8.8.1

This guide lives in your workspace as a resource for setting up Claude Code, optimizing workflows, managing context, running parallel sessions, and unlocking advanced agent capabilities.

## Context Map — Quick Reference

| Action | Practical Tip |
|--------|---------------|
| **Editing multiple files** | Shift+Tab into Plan Mode first (or trust Fable 5's improved autonomy). |
| **Encountering repeating errors** | Do not just re-prompt; update rules in `CLAUDE.md` so the model remembers forever. |
| **Large-scale refactors** | Mention "use a workflow" to invoke dynamic fanned-out parallel orchestration. |
| **Claude went down a wrong path** | Avoid correcting sequentially; use `/rewind` or Double-Esc to clear the context. |
| **Running out of token space** | Use `/compact <hint>` or lower `CLAUDE_CODE_AUTO_COMPACT_WINDOW` to 400000. |

## Top 10 Tips for Professional AI Coding

### 1. Give Claude a Way to Verify Its Work
The absolute #1 tip for 2x-3x quality boost: provide a test suite, terminal commands, or emulator. A verification feedback loop allows the agent to self-correct before declaring victory.

### 2. Practice Context Minimalism
Tell the model only what it *needs* to know. Stop frontloading massive system prompts. Instead, give a lean, crisp brief highlighting:
- **Goal**: What success looks like
- **Constraints**: Non-goals & boundaries
- **Acceptance Criteria**: How verification will prove it works

### 3. Write It Down, Don't Re-Prompt
Anytime an agent makes a mistake, guide it to write the fix to `CLAUDE.md` or a permanent project skill. Conversational corrections are hot-patches; written rules compound over weeks.

### 4. Leverage Auto Mode for Parallel Work
Auto mode routes permission prompts to a secured model-based classifier. Clean, safe operations auto-approve, whereas risky ones prompt. Combining auto mode with multiple git worktrees is the ultimate productivity unlock.

### 5. Command `/btw` for Multi-tasking
Use `/btw` (By The Way) for side-questions (like syntax or Spoor explanations) while your script runs in the background. It is single-turn, does not trigger tool calls, and preserves clean contexts.

### 6. The "use a workflow" Orchestrator
To solve complex parallel operations (A/B testing catalogs, code migration runs, mass bug fixing), type "use a workflow". Active Orchestration splits jobs into isolated Implementers and adversarial Verifiers, solving agentic laziness, self-preferential bias, and goal drift.

### 7. Shift-tab Lifecycle modes
Cycle seamlessly between `Plan Mode` (for thinking), `Auto Mode` (for swift execution), and `Normal Mode` using your keyboard shortcut.

### 8. Run `claude agents` control plane
Manage a fleet of open coding sessions grouped elegantly in statuses from your root projects path.

### 9. Deploy `/goal` to Overcome Stalls
Establish a clear completion boundary utilizing `/goal`. The Ralph loop self-checks completion before giving a final summary report.

### 10. Upgrade to Claude Fable 5
Anthropic's latest Mythos-class model is the state-of-the-art coding powerhouse. Relying on adaptive reasoning, Fable requires fewer guides, behaves more methodically, and includes robust self-verification out-of-the-box.
