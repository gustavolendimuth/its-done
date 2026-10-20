import { createServer, Server } from "http";

export interface CapturedEmail {
  to: string;
  subject: string;
  html: string;
}

// Stands in for api.resend.com. The backend points at it through the
// RESEND_BASE_URL env var that the resend SDK reads, so real emails are never
// sent and the smoke can read the links the backend actually generated.
export class MockResend {
  private server: Server | undefined;
  readonly emails: CapturedEmail[] = [];

  start(port: number): Promise<void> {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        if (req.method === "POST" && req.url === "/emails") {
          const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
          const to = Array.isArray(body.to) ? body.to[0] : body.to;
          this.emails.push({ to, subject: body.subject, html: body.html });
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ id: `mock-${this.emails.length}` }));
          return;
        }
        res.writeHead(404, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ message: `mock-resend: no route ${req.url}` }),
        );
      });
    });
    return new Promise((resolve, reject) => {
      this.server!.once("error", reject);
      this.server!.listen(port, "127.0.0.1", resolve);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve(),
    );
  }

  async waitForEmail(
    to: string,
    subjectIncludes: string,
    timeoutMs = 15_000,
  ): Promise<CapturedEmail> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const found = this.emails.find(
        (e) => e.to === to && e.subject.includes(subjectIncludes),
      );
      if (found) return found;
      await new Promise((r) => setTimeout(r, 200));
    }
    const seen = this.emails.map((e) => `${e.to} | ${e.subject}`).join("\n  ");
    throw new Error(
      `No email to ${to} with subject containing "${subjectIncludes}" within ${timeoutMs}ms. Captured:\n  ${seen || "(none)"}`,
    );
  }
}
