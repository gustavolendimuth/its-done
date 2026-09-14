## Manual/Visual Verification (Playwright)

- This project has a project-local MCP server named `playwright` (scope: local,
  registered via `claude mcp add --scope local playwright npx -- @playwright/mcp@latest
  --headless`) that runs **headless** — no visible browser window, so it never steals
  focus. Use its `mcp__playwright__*` tools for manual/e2e-style verification in this
  project instead of the account-wide `mcp__plugin_playwright_playwright__*` plugin
  tools (which open a headed, focus-stealing window). This is scoped to this project
  only; other projects still use the headed plugin browser.
