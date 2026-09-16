export interface ParsedTaskLink {
  link: string;
  suggestedTitle?: string;
}

// linear.app/<team>/issue/<KEY>-<n>/<slug> — the slug carries a real title,
// so the suggestion includes it (de-slugified) alongside the key.
const LINEAR_ISSUE_REGEX =
  /linear\.app\/[^/]+\/issue\/([a-zA-Z]+-\d+)(?:\/([^/?#]+))?/i;

// <site>.atlassian.net/browse/<KEY>-<n> — Jira URLs never carry the issue's
// title, only the key, so the suggestion is the key alone.
const JIRA_ISSUE_REGEX = /\.atlassian\.net\/browse\/([a-zA-Z]+-\d+)/i;

function capitalize(word: string): string {
  return word.length ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

function deslugify(slug: string): string {
  const words = slug.split("-").filter(Boolean);
  return words.map((word, index) => (index === 0 ? capitalize(word) : word)).join(" ");
}

/**
 * Parses a pasted task link, extracting a title suggestion when the URL
 * itself carries that information (Jira: key only; Linear: key + de-slugified
 * title). Any other URL (GitHub Issues, Trello, a plain link, ...) is
 * accepted with no suggestion — the caller leaves the title field untouched
 * for the user to fill in.
 */
export function parseTaskLink(url: string): ParsedTaskLink {
  const link = url.trim();
  if (!link) {
    return { link };
  }

  const linearMatch = link.match(LINEAR_ISSUE_REGEX);
  if (linearMatch) {
    const [, key, slug] = linearMatch;
    const suggestedTitle = slug
      ? `${key.toUpperCase()} ${deslugify(slug)}`
      : key.toUpperCase();
    return { link, suggestedTitle };
  }

  const jiraMatch = link.match(JIRA_ISSUE_REGEX);
  if (jiraMatch) {
    return { link, suggestedTitle: jiraMatch[1].toUpperCase() };
  }

  return { link };
}
