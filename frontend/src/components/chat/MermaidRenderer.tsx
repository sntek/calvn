"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  code: string;
}

export function MermaidRenderer({ code }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            background: "transparent",
            primaryColor: "#3b82f6",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "rgba(255,255,255,0.15)",
            lineColor: "rgba(255,255,255,0.3)",
            secondaryColor: "rgba(255,255,255,0.05)",
            tertiaryColor: "rgba(255,255,255,0.03)",
            edgeLabelBackground: "rgba(15,15,30,0.9)",
            fontFamily: "ui-monospace, monospace",
          },
        });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = ref.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="text-xs text-red-400 whitespace-pre-wrap my-2">
        Diagram error: {error}
      </pre>
    );
  }

  return (
    <div className="my-4 rounded-xl border border-white/10 bg-white/5 p-4 overflow-x-auto">
      <div ref={ref} className="flex justify-center" />
    </div>
  );
}
