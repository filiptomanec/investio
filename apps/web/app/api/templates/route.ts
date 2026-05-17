// GET /api/templates — list public templates (no auth required)

import type { NextRequest } from "next/server";
import { prisma } from "@investio/db/client";
import type { Template } from "@investio/db";
import { ListTemplatesQuerySchema } from "@investio/shared/schemas";
import { parseQuery } from "@/lib/validate";
import { toApiError } from "@/lib/errors";
import { toTemplate } from "@/lib/mappers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(req, ListTemplatesQuerySchema);

    const where: Record<string, unknown> = {};
    if (query.type !== "all") {
      where["type"] = query.type;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { display_order: "asc" },
    });

    const locale = query.locale ?? "cs";
    return Response.json({
      templates: templates.map((t: Template) => toTemplate(t, locale)),
    });
  } catch (err) {
    return toApiError(err);
  }
}
