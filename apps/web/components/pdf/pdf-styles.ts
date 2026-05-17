/**
 * Shared @react-pdf/renderer StyleSheet definitions.
 *
 * Brand: Investio Teal #0f766e (primary), Slate neutrals, system Helvetica.
 * These are used by CompoundPdf, RealEstatePdf, ComparisonPdf.
 */
import { StyleSheet } from "@react-pdf/renderer";

export const BRAND_TEAL = "#0f766e";
export const BRAND_TEAL_LIGHT = "#ccfbf1"; // teal-100
export const BRAND_AMBER = "#f59e0b";
export const SLATE_900 = "#0f172a";
export const SLATE_600 = "#475569";
export const SLATE_400 = "#94a3b8";
export const SLATE_200 = "#e2e8f0";
export const SLATE_100 = "#f1f5f9";
export const SUCCESS_GREEN = "#15803d";
export const DANGER_RED = "#dc2626";
export const WHITE = "#ffffff";

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: SLATE_900,
    backgroundColor: WHITE,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
  },
  // ---- Header ----
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_TEAL,
  },
  headerLogo: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: BRAND_TEAL,
    letterSpacing: 0.5,
  },
  headerMeta: {
    fontSize: 8,
    color: SLATE_600,
    textAlign: "right",
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginTop: 2,
    textAlign: "right",
  },
  // ---- Section ----
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND_TEAL,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND_TEAL,
  },
  // ---- 2-column input/output table ----
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: SLATE_200,
  },
  tableRowAlt: {
    backgroundColor: SLATE_100,
  },
  tableLabel: {
    flex: 1,
    fontSize: 8,
    color: SLATE_600,
  },
  tableValue: {
    fontSize: 8,
    color: SLATE_900,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  // ---- Hero result box ----
  heroBox: {
    backgroundColor: BRAND_TEAL_LIGHT,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 9,
    color: BRAND_TEAL,
    fontFamily: "Helvetica-Bold",
  },
  heroValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND_TEAL,
  },
  // ---- Results grid (2 cols) ----
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  resultCell: {
    width: "48%",
    backgroundColor: SLATE_100,
    borderRadius: 3,
    padding: 6,
  },
  resultCellLabel: {
    fontSize: 7,
    color: SLATE_600,
    marginBottom: 2,
  },
  resultCellValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  resultCellValuePositive: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SUCCESS_GREEN,
  },
  resultCellValueNegative: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DANGER_RED,
  },
  // ---- Time series table ----
  tsTable: {
    marginTop: 4,
  },
  tsHeaderRow: {
    flexDirection: "row",
    backgroundColor: BRAND_TEAL,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  tsHeaderCell: {
    fontSize: 7,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    flex: 1,
  },
  tsHeaderCellFirst: {
    fontSize: 7,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  tsRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 0.3,
    borderBottomColor: SLATE_200,
  },
  tsRowAlt: {
    backgroundColor: SLATE_100,
  },
  tsCell: {
    fontSize: 7,
    color: SLATE_900,
    textAlign: "right",
    flex: 1,
  },
  tsCellFirst: {
    fontSize: 7,
    color: SLATE_600,
    flex: 1,
  },
  // ---- Footer ----
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: SLATE_200,
  },
  footerText: {
    fontSize: 7,
    color: SLATE_400,
    textAlign: "center",
  },
  // ---- Comparison ----
  colHeader: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  twoColContainer: {
    flexDirection: "row",
    gap: 12,
  },
  twoColLeft: {
    flex: 1,
  },
  twoColRight: {
    flex: 1,
  },
  diffHeaderRow: {
    flexDirection: "row",
    backgroundColor: SLATE_900,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  diffHeaderCell: {
    fontSize: 7,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    flex: 1,
  },
  diffHeaderCellFirst: {
    fontSize: 7,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    flex: 2,
  },
  diffRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 0.3,
    borderBottomColor: SLATE_200,
  },
  diffCell: {
    fontSize: 7,
    color: SLATE_900,
    textAlign: "right",
    flex: 1,
  },
  diffCellFirst: {
    fontSize: 7,
    color: SLATE_600,
    flex: 2,
  },
  winnerBadge: {
    backgroundColor: BRAND_TEAL_LIGHT,
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  winnerBadgeLabel: {
    fontSize: 8,
    color: SLATE_600,
  },
  winnerBadgeValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND_TEAL,
  },
});
