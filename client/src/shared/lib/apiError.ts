import { isAxiosError } from "axios";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

interface ServerErrorBody {
  error?: { message?: string };
}

export async function extractApiErrorMessage(error: unknown): Promise<string> {
  if (!isAxiosError(error)) return FALLBACK_MESSAGE;

  const data: unknown = error.response?.data;

  // requests made with responseType: "blob" get their error bodies back as
  // a Blob too, even when the server sent JSON — axios does not auto-parse
  // it for us in the error case, only the success case.
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as ServerErrorBody;
      return parsed.error?.message ?? FALLBACK_MESSAGE;
    } catch {
      return FALLBACK_MESSAGE;
    }
  }

  if (data && typeof data === "object" && "error" in data) {
    const message = (data as ServerErrorBody).error?.message;
    if (message) return message;
  }

  return FALLBACK_MESSAGE;
}
