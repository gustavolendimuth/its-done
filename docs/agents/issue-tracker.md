# Issue tracker: Jira

Issues and specs for this repo live in Jira project **MW** ("My Workspace"), site `gustavolendimuth.atlassian.net`
(cloudId `c0eab771-d96a-4175-aa80-87f17c500d4b`). Use the `mcp__claude_ai_Atlassian_Rovo__*` MCP tools for all
operations — never guess REST calls.

## Issue types

`Epic`, `Feature`, `História` (story), `Tarefa` (task), `Bug`, `Subtarefa` (subtask).

## Conventions

- **Create an issue**: `createJiraIssue` (cloudId, project key `MW`, issue type, summary, description).
- **Read an issue**: `getJiraIssue` (key, e.g. `MW-123`).
- **Search issues**: `searchJiraIssuesUsingJql` with `project = MW AND ...`.
- **Comment on an issue**: `addCommentToJiraIssue`.
- **Apply a transition (status change, incl. close)**: `getTransitionsForJiraIssue` to list valid transitions, then `transitionJiraIssue`.
- **Edit fields**: `editJiraIssue`.
- **Link two issues** (e.g. blocks/relates): `getIssueLinkTypes` then `createIssueLink`.

There's no `git remote`-based repo inference for Jira — the project key is fixed to `MW`.

## When a skill says "publish to the issue tracker"

Create a Jira issue in project MW via `createJiraIssue`.

## When a skill says "fetch the relevant ticket"

`getJiraIssue` with the issue key (e.g. `MW-42`).
