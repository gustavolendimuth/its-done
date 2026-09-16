import { parseTaskLink } from "./parse-task-link";

describe("parseTaskLink", () => {
  it("suggests key + de-slugified title for a Linear issue link", () => {
    expect(
      parseTaskLink("https://linear.app/acme/issue/ENG-123/fix-login-bug")
    ).toEqual({
      link: "https://linear.app/acme/issue/ENG-123/fix-login-bug",
      suggestedTitle: "ENG-123 Fix login bug",
    });
  });

  it("suggests only the key for a Linear issue link with no slug", () => {
    expect(parseTaskLink("https://linear.app/acme/issue/ENG-123")).toEqual({
      link: "https://linear.app/acme/issue/ENG-123",
      suggestedTitle: "ENG-123",
    });
  });

  it("suggests only the key for a Jira issue link (no title available)", () => {
    expect(
      parseTaskLink("https://acme.atlassian.net/browse/PROJ-123")
    ).toEqual({
      link: "https://acme.atlassian.net/browse/PROJ-123",
      suggestedTitle: "PROJ-123",
    });
  });

  it("suggests nothing for a generic URL (GitHub, Trello, etc.)", () => {
    expect(parseTaskLink("https://github.com/acme/repo/issues/42")).toEqual({
      link: "https://github.com/acme/repo/issues/42",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseTaskLink("  https://acme.atlassian.net/browse/PROJ-1  ")).toEqual({
      link: "https://acme.atlassian.net/browse/PROJ-1",
      suggestedTitle: "PROJ-1",
    });
  });

  it("returns an empty link with no suggestion for an empty string", () => {
    expect(parseTaskLink("   ")).toEqual({ link: "" });
  });
});
