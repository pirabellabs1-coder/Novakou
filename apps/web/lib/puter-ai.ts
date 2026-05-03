/**
 * Helper for extracting plain text from a Puter `ai.chat()` response.
 *
 * Why this exists: Puter forwards Anthropic's content blocks shape ─
 * `{ message: { content: [{ type: 'text', text: '...' }] } }` ─ but
 * different callers in the codebase had inconsistently treated `content`
 * as either a string OR an array, causing `(content).trim()` to throw a
 * `TypeError: content.trim is not a function` when an array came back.
 * That exception was swallowed by a generic catch and surfaced to users
 * as "Service IA temporairement indisponible. Réessayez dans quelques
 * instants." even though the AI call had succeeded.
 *
 * Always go through this helper instead of reading `res.message.content`
 * directly so a future Puter response-shape change can be patched in one
 * place.
 */
export type PuterChatResponse =
  | string
  | {
      message?: {
        content?:
          | string
          | Array<{ type?: string; text?: string } | string>;
      };
    };

export function extractPuterText(res: PuterChatResponse | null | undefined): string {
  if (!res) return "";
  if (typeof res === "string") return res;
  const c = res.message?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object" && typeof block.text === "string") return block.text;
        return "";
      })
      .join("");
  }
  return "";
}
