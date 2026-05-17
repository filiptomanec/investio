// API request/response schemas — shared between Route Handlers and clients.
// These are the Zod schemas referenced in docs/api.md.

import { z } from "zod";
import { ScenarioInputSchema } from "./scenario";

// ---------------------------------------------------------------------------
// Scenario summary (used in list + embedded in detail)
// ---------------------------------------------------------------------------

export const ScenarioSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(["compound", "real_estate"]),
  currency: z.enum(["CZK", "EUR", "USD"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().nullable(),
});

export type ScenarioSummary = z.infer<typeof ScenarioSummarySchema>;

// ---------------------------------------------------------------------------
// Scenario detail
// ---------------------------------------------------------------------------

export const ScenarioDetailSchema = ScenarioSummarySchema.extend({
  inputs: ScenarioInputSchema,
  basedOnTemplateId: z.string().uuid().nullable(),
});

export type ScenarioDetail = z.infer<typeof ScenarioDetailSchema>;

// ---------------------------------------------------------------------------
// GET /api/scenarios query params
// ---------------------------------------------------------------------------

export const ListScenariosQuerySchema = z.object({
  type: z.enum(["compound", "real_estate", "all"]).default("all"),
  archived: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export type ListScenariosQuery = z.infer<typeof ListScenariosQuerySchema>;

// ---------------------------------------------------------------------------
// GET /api/scenarios response
// ---------------------------------------------------------------------------

export const ListScenariosResponseSchema = z.object({
  scenarios: z.array(ScenarioSummarySchema),
  nextCursor: z.string().uuid().nullable(),
});

export type ListScenariosResponse = z.infer<typeof ListScenariosResponseSchema>;

// ---------------------------------------------------------------------------
// POST /api/scenarios body
// ---------------------------------------------------------------------------

export const CreateScenarioBodySchema = z.object({
  name: z.string().min(1).max(120),
  currency: z.enum(["CZK", "EUR", "USD"]).default("CZK"),
  inputs: ScenarioInputSchema,
  basedOnTemplateId: z.string().uuid().optional(),
});

export type CreateScenarioBody = z.infer<typeof CreateScenarioBodySchema>;

// ---------------------------------------------------------------------------
// POST /api/scenarios response
// ---------------------------------------------------------------------------

export const CreateScenarioResponseSchema = z.object({
  scenario: ScenarioDetailSchema,
});

export type CreateScenarioResponse = z.infer<
  typeof CreateScenarioResponseSchema
>;

// ---------------------------------------------------------------------------
// PATCH /api/scenarios/:id body
// ---------------------------------------------------------------------------

export const UpdateScenarioBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  inputs: ScenarioInputSchema.optional(),
  archived: z.boolean().optional(),
});

export type UpdateScenarioBody = z.infer<typeof UpdateScenarioBodySchema>;

// ---------------------------------------------------------------------------
// POST /api/scenarios/:id/duplicate body
// ---------------------------------------------------------------------------

export const DuplicateScenarioBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
});

export type DuplicateScenarioBody = z.infer<typeof DuplicateScenarioBodySchema>;

// ---------------------------------------------------------------------------
// GET /api/templates query params
// ---------------------------------------------------------------------------

export const ListTemplatesQuerySchema = z.object({
  type: z.enum(["compound", "real_estate", "all"]).default("all"),
  locale: z.enum(["cs", "en"]).default("cs"),
});

export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuerySchema>;

// ---------------------------------------------------------------------------
// Template schema
// ---------------------------------------------------------------------------

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  type: z.enum(["compound", "real_estate"]),
  name: z.string(),
  description: z.string(),
  inputs: ScenarioInputSchema,
  currency: z.enum(["CZK", "EUR", "USD"]),
  sourceUrl: z.string().url().nullable(),
});

export type Template = z.infer<typeof TemplateSchema>;

// ---------------------------------------------------------------------------
// GET /api/templates response
// ---------------------------------------------------------------------------

export const ListTemplatesResponseSchema = z.object({
  templates: z.array(TemplateSchema),
});

export type ListTemplatesResponse = z.infer<typeof ListTemplatesResponseSchema>;

// ---------------------------------------------------------------------------
// Path params
// ---------------------------------------------------------------------------

export const ScenarioIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ScenarioIdParam = z.infer<typeof ScenarioIdParamSchema>;

export const TemplateSlugParamSchema = z.object({
  slug: z.string().min(1).max(120),
});

export type TemplateSlugParam = z.infer<typeof TemplateSlugParamSchema>;
