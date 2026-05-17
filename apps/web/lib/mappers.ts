// Mappers from Prisma model instances to API response shapes.
// Keeps route handlers clean — no manual field mapping inline.

import type { Scenario, Template } from "@investio/db";
import type {
  ScenarioDetail,
  ScenarioSummary,
  Template as ApiTemplate,
  ScenarioInput,
} from "@investio/shared/schemas";
import { NotFoundError } from "./errors";

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

export function toScenarioSummary(s: Scenario): ScenarioSummary {
  return {
    id: s.id,
    name: s.name,
    type: s.type as "compound" | "real_estate",
    currency: s.currency as "CZK" | "EUR" | "USD",
    createdAt: s.created_at.toISOString(),
    updatedAt: s.updated_at.toISOString(),
    archivedAt: s.archived_at ? s.archived_at.toISOString() : null,
  };
}

export function toScenarioDetail(
  s: Scenario & { based_on_template?: Template | null },
): ScenarioDetail {
  return {
    ...toScenarioSummary(s),
    inputs: s.inputs as ScenarioInput,
    basedOnTemplateId: s.based_on_template_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export function toTemplate(t: Template, locale: "cs" | "en"): ApiTemplate {
  const name = locale === "en" ? t.name_en : t.name_cs;
  const description =
    locale === "en"
      ? (t.description_en ?? t.description_cs ?? "")
      : (t.description_cs ?? t.description_en ?? "");

  return {
    id: t.id,
    slug: t.slug,
    type: t.type as "compound" | "real_estate",
    name,
    description,
    inputs: t.inputs as ScenarioInput,
    currency: t.currency as "CZK" | "EUR" | "USD",
    sourceUrl: t.source_url ?? null,
  };
}

// ---------------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------------

/**
 * Assert that the row is non-null/undefined, throwing NotFoundError otherwise.
 * The `asserts` return type tells TypeScript this narrows the type.
 *
 * Covers cases where RLS filtered out the row (findUnique returns null).
 */
export function assertFound<T>(
  row: T | null | undefined,
  message = "Resource not found",
): asserts row is T {
  if (row == null) throw new NotFoundError(message);
}
