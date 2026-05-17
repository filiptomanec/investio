// POST /api/scenarios/:id/duplicate — copy a scenario (user-owned or template-based)

import type { NextRequest } from "next/server";
import { getPrismaForUser } from "@investio/db/client";
import {
  ScenarioIdParamSchema,
  DuplicateScenarioBodySchema,
} from "@investio/shared/schemas";
import { requireUser } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { toApiError } from "@/lib/errors";
import { assertFound, toScenarioDetail } from "@/lib/mappers";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { userId } = await requireUser();
    const { id } = ScenarioIdParamSchema.parse(await ctx.params);

    // Try to parse optional body — default empty object is fine
    let body: { name?: string } = {};
    try {
      body = await parseBody(req, DuplicateScenarioBodySchema);
    } catch {
      // Body may be absent (empty POST) — proceed with defaults
    }

    const db = getPrismaForUser(userId);
    const original = await db.scenario.findUnique({ where: { id } });
    assertFound(original);

    const duplicate = await db.scenario.create({
      data: {
        user_id: userId,
        name: body.name ?? `Kopie ${original.name}`,
        type: original.type,
        currency: original.currency,
        inputs: original.inputs as Record<string, unknown>,
        based_on_template_id: original.based_on_template_id,
      },
    });

    return Response.json({ scenario: toScenarioDetail(duplicate) }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
