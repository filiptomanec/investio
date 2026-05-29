export {
  calculateInvestment,
  solveMonthlyForTargetIncome,
  calculateMortgage,
  compareMortgageStrategies,
  type InvestmentInputs,
  type InvestmentResult,
  type YearPoint,
  type RentaInputs,
  type RentaResult,
  type MortgageInput,
  type MortgageResult,
  type MortgageYearPoint,
  type MortgageCompareInput,
  type MortgageCompareResult,
} from "./finance";
export { formatCurrency, formatNumber, currencyForLocale } from "./formatters";
export type { SupportedLocale, SupportedCurrency } from "./formatters";
export { reformatRaw, caretSig, caretTarget } from "./input-formatting";
export {
  fetchCzechInflation,
  type InflationAverage,
  type InflationSample,
} from "./inflation";
