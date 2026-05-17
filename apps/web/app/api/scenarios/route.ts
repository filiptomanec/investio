// GET /api/scenarios  — list the authenticated user's scenarios
// POST /api/scenarios — create a new scenario

import type { NextRequest } from "next/server";
import { getPrismaForUser } from "@investio/db/client";
import {
  ListScenariosQuerySchema,
  CreateScenarioBodySchema,
} from "@investio/shared/schemas";
import { requireUser } from "@/lib/auth";
import { parseBody, parseQuery } from "@/lib/validate";
import { toApiError } from "@/lib/errors";
import { toScenarioSummary, toScenarioDetail } from "@/lib/mappers";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/scenarios
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const query = parseQuery(req, ListScenariosQuerySchema);
    const limit = query.limit ?? 50;
    const db = getPrismaForUser(userId);

    const where: Record<string, unknown> = { user_id: userId };

    if (!query.archived) {
      where["archived_at"] = null;
    }
    if (query.type !== "all") {
      where["type"] = query.type;
    }
    if (query.cursor) {
      // cursor-based pagination: find rows created_at <= cursor row's created_at
      // Simple approach: skip scenarios with id < cursor (UUID order)
      where["id"] = { gt: query.cursor };
    }

    const scenarios = await db.scenario.findMany({
      where,
      orderBy: { updated_at: "desc" },
      take: limit + 1, // fetch one extra to determine if there's a next page
    });

    const hasNextPage = scenarios.length > limit;
    const items = hasNextPage ? scenarios.slice(0, limit) : scenarios;
    const nextCursor =
      hasNextPage && items.length > 0
        ? (items[items.length - 1]?.id ?? null)
        : null;

    return Response.json({
      scenarios: items.map(toScenarioSummary),
      nextCursor,
    });
  } catch (err) {
    return toApiError(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/scenarios
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await parseBody(req, CreateScenarioBodySchema);
    const db = getPrismaForUser(userId);

    const scenario = await db.scenario.create({
      data: {
        user_id: userId,
        name: body.name,
        type: body.inputs.type,
        currency: body.currency,
        inputs: body.inputs,
        based_on_template_id: body.basedOnTemplateId ?? null,
      },
    });

    return Response.json({ scenario: toScenarioDetail(scenario) }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
