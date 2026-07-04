"use client";

import { useEffect } from "react";

// When the page is opened with ?print=1 (the dashboard's "Download PDF"
// button), open the browser print dialog once the document has rendered.
export function AutoPrint() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("print") === "1") {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, []);
  return null;
}
