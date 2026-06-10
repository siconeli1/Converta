type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    const structured = error as Error & {
      code?: string;
      details?: Record<string, unknown>;
    };
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: structured.code,
      details: structured.details,
    };
  }
  return { message: String(error) };
}

export function logInfo(message: string, context: LogContext = {}) {
  console.log(JSON.stringify({
    level: "info",
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }));
}

export async function reportError(
  error: unknown,
  context: LogContext = {},
) {
  const payload = {
    level: "error",
    timestamp: new Date().toISOString(),
    error: serializeError(error),
    ...context,
  };

  console.error(JSON.stringify(payload));

  if (process.env.ERROR_WEBHOOK_URL) {
    try {
      await fetch(process.env.ERROR_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (webhookError) {
      console.error(JSON.stringify({
        level: "error",
        message: "Error webhook delivery failed",
        timestamp: new Date().toISOString(),
        error: serializeError(webhookError),
      }));
    }
  }
}
