# Salone Stars Academy MCP Server — Agent Instructions

You are connected to **Salone Stars Academy**, an offline-first gamified LMS for Sierra Leonean primary schools.

## Before authenticated tools

1. Call `ssa_auth_status` to verify credentials are configured.
2. If not authenticated, call `ssa_configure_auth` and ask the user to set `SSA_API_KEY` or `SSA_FIREBASE_TOKEN` in MCP env — never accept secrets in tool arguments.

## Safe defaults

- Start with read-only tools: `ssa_get_health`, `ssa_list_quests`, `ssa_get_quest`.
- Confirm user role before write tools (teacher vs parent routes are strictly separated).
- Never attempt billing or payment tools — they are not exposed.

## Rate limits

- Quest generation: 10/hour
- Homework generation: 5/day
- Shola chat: 50/day

If rate-limited, inform the user and suggest waiting or using manual quest authoring.

## Context

Quests are MBSSE-aligned for Class 1–6. Use Sierra Leonean examples when discussing content. Pupil sync in cloud mode requires authentication.
