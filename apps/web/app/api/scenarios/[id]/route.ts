// GET    /api/scenarios/:id — fetch scenario detail
// PATCH  /api/scenarios/:id — update name / inputs / archived state
// DELETE /api/scenarios/:id — soft delete (archived_at = now())

import type { NextRequest } from "next/server";
import { getPrismaForUser } from "@investio/db/client";
import {
  ScenarioIdParamSchema,
  UpdateScenarioBodySchema,
} from "@investio/shared/schemas";
import { requireUser } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { toApiError, NotFoundError, ValidationError } from "@/lib/errors";
import { toScenarioDetail, assertFound } from "@/lib/mappers";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/scenarios/:id
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { userId } = await requireUser();
    const { id } = ScenarioIdParamSchema.parse(await ctx.params);
    const db = getPrismaForUser(userId);

    const scenario = await db.scenario.findUnique({ where: { id } });
    assertFound(scenario);

    return Response.json({ scenario: toScenarioDetail(scenario) });
  } catch (err) {
    return toApiError(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/scenarios/:id
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { userId } = await requireUser();
    const { id } = ScenarioIdParamSchema.parse(await ctx.params);
    const body = await parseBody(req, UpdateScenarioBodySchema);
    const db = getPrismaForUser(userId);

    // Ensure the scenario exists and belongs to the user (RLS would silently
    // return nothing on update, so we check explicitly for a better DX error).
    const existing = await db.scenario.findUnique({ where: { id } });
    assertFound(existing);

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (body.name !== undefined) updateData["name"] = body.name;
    if (body.inputs !== undefined) {
      updateData["inputs"] = body.inputs;
      // If inputs type changes, sync the type column
      updateData["type"] = body.inputs.type;
    }
    if (body.archived === true) {
      updateData["archived_at"] = new Date();
    } else if (body.archived === false) {
      updateData["archived_at"] = null;
    }

    if (Object.keys(updateData).length === 1) {
      // Only updated_at — nothing meaningful to update
      throw new ValidationError(
        {},
        "Request body must include at least one field to update",
      );
    }

    const updated = await db.scenario.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ scenario: toScenarioDetail(updated) });
  } catch (err) {
    return toApiError(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/scenarios/:id (soft delete)
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const { userId } = await requireUser();
    const { id } = ScenarioIdParamSchema.parse(await ctx.params);
    const db = getPrismaForUser(userId);

    const existing = await db.scenario.findUnique({ where: { id } });
    assertFound(existing);

    await db.scenario.update({
      where: { id },
      data: { archived_at: new Date(), updated_at: new Date() },
    });

    return Response.json({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
