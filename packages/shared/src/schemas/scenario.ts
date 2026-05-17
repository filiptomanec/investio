import { z } from "zod";

export const CompoundInputSchema = z.object({
  type: z.literal("compound"),
  initialAmount: z.number().nonnegative(),
  monthlyContribution: z.number().nonnegative(),
  annualReturnPct: z.number().min(-1).max(1),
  horizonYears: z.number().int().min(1).max(50),
  contributionTiming: z.enum(["begin", "end"]).default("end"),
});

export type CompoundInput = z.infer<typeof CompoundInputSchema>;

export const RealEstateInputBaseSchema = z.object({
  type: z.literal("real_estate"),
  purchasePrice: z.number().positive(),
  downPayment: z.number().nonnegative(),
  mortgage: z.object({
    annualRatePct: z.number().min(0).max(0.5),
    termYears: z.number().int().min(1).max(40),
  }),
  monthlyRent: z.number().nonnegative(),
  monthlyExpenses: z.number().nonnegative(),
  vacancyRatePct: z.number().min(0).max(1).default(0.05),
  maintenancePctOfRent: z.number().min(0).max(1).default(0.05),
  annualAppreciationPct: z.number().min(-0.2).max(0.5).default(0.03),
  annualRentGrowthPct: z.number().min(-0.2).max(0.2).default(0.02),
  incomeTaxPct: z.number().min(0).max(0.5).default(0.15),
  horizonYears: z.number().int().min(1).max(30),
  exitMonth: z.number().int().positive().optional(),
});

// With cross-field refinement for API validation (downPayment <= purchasePrice).
// ZodEffects cannot be used inside discriminatedUnion, so we export both forms:
// - RealEstateInputSchema with refine → use for standalone parse/validation
// - RealEstateInputBaseSchema → used inside discriminatedUnion
export const RealEstateInputSchema = RealEstateInputBaseSchema.refine(
  (d) => d.downPayment <= d.purchasePrice,
  {
    message: "Down payment can't exceed purchase price",
    path: ["downPayment"],
  }
);

export type RealEstateInput = z.infer<typeof RealEstateInputBaseSchema>;

export const ScenarioInputSchema = z.discriminatedUnion("type", [
  CompoundInputSchema,
  RealEstateInputBaseSchema,
]);

export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;
