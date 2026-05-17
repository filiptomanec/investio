"use client";

/**
 * ExportPdfButton — client component that generates and downloads a PDF.
 *
 * @react-pdf/renderer must run client-side only. We use dynamic import with
 * { ssr: false } pattern via lazy loading inside the click handler so the
 * heavy PDF bundle is never included in the server render.
 *
 * The `documentFactory` prop is a callback that returns a React element
 * (the PDF document). This avoids importing heavy PDF components at module
 * load time.
 */

import { useState, type ReactElement } from "react";
import { FileDown, Loader2 } from "lucide-react";
import type { DocumentProps } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { triggerPdfDownload } from "@/lib/pdf";

interface ExportPdfButtonProps {
  /** Factory called on click to produce the <Document> element. */
  documentFactory: () => ReactElement;
  filename: string;
  label: string;
  disabled?: boolean;
}

export function ExportPdfButton({
  documentFactory,
  filename,
  label,
  disabled = false,
}: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      // Dynamically import @react-pdf/renderer so it's only bundled
      // for clients that actually click Export PDF (code-split).
      const { pdf } = await import("@react-pdf/renderer");
      const element = documentFactory();
      // Cast required: documentFactory returns ReactElement<unknown> (generic type
      // parameter cannot be inferred at call site), but @react-pdf/renderer's pdf()
      // expects ReactElement<DocumentProps>. The factory is always called with a
      // <Document> root element — the cast is safe at runtime.
      const blob = await pdf(element as ReactElement<DocumentProps>).toBlob();
      triggerPdfDownload(blob, filename);
    } catch (err) {
      // In a real app this would surface as a toast; for MVP log to console.
      console.error("[ExportPdfButton] PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={label}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
