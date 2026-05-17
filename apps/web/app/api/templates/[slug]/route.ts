// GET /api/templates/:slug — template detail (no auth required)

import type { NextRequest } from "next/server";
import { prisma } from "@investio/db/client";
import { ListTemplatesQuerySchema, TemplateSlugParamSchema } from "@investio/shared/schemas";
import { parseQuery } from "@/lib/validate";
import { toApiError } from "@/lib/errors";
import { toTemplate, assertFound } from "@/lib/mappers";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { slug } = TemplateSlugParamSchema.parse(await ctx.params);
    // Reuse locale param from ListTemplatesQuerySchema (only locale matters here)
    const query = parseQuery(
      req,
      ListTemplatesQuerySchema.pick({ locale: true }),
    );

    const template = await prisma.template.findUnique({ where: { slug } });
    assertFound(template, `Template '${slug}' not found`);

    const locale = query.locale ?? "cs";
    return Response.json({ template: toTemplate(template, locale) });
  } catch (err) {
    return toApiError(err);
  }
}
