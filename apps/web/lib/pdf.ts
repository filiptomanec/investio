/**
 * PDF download helper for @react-pdf/renderer blob-based exports.
 *
 * Usage:
 *   const blob = await pdf(<CompoundPdf ... />).toBlob();
 *   triggerPdfDownload(blob, "investio-compound-2026-05-17.pdf");
 */

export function triggerPdfDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  // Must be in DOM for Firefox
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Release memory after small delay to let browser initiate download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Build a filename in the form:
 *   investio-<type>-<YYYY-MM-DD>.pdf
 */
export function buildPdfFilename(type: "compound" | "real-estate" | "comparison"): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `investio-${type}-${yyyy}-${mm}-${dd}.pdf`;
}
