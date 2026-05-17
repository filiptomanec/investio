// Validation helpers for Route Handlers.
// Parse request body or query params with a Zod schema.
// On parse failure, throws ValidationError (mapped to 400 by toApiError).

import type { NextRequest } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { fromZodError } from "./errors";

/**
 * Parse the JSON request body against a Zod schema.
 * Throws ValidationError on failure.
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw fromZodError(
      new ZodError([
        {
          code: "custom",
          path: [],
          message: "Request body must be valid JSON",
        },
      ]),
    );
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw fromZodError(result.error);
  }
  return result.data;
}

/**
 * Parse URL search params against a Zod schema.
 * Throws ValidationError on failure.
 *
 * All search param values arrive as strings, so the schema should use
 * z.coerce.* for numeric and boolean fields.
 */
export function parseQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): T {
  const params = req.nextUrl.searchParams;
  // Convert URLSearchParams to a plain record
  const raw: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    raw[key] = value;
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw fromZodError(result.error);
  }
  return result.data;
}
