import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { DirectionA } from "@/components/directions/direction-a";
import { DirectionB } from "@/components/directions/direction-b";
import { DirectionC } from "@/components/directions/direction-c";
import { useLanguageSync } from "@/hooks/use-language-sync";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

type Dir = "a" | "b" | "c";

// Preview of three design directions for the investment page. Not linked
// from the app; reached by URL only while a direction is being chosen.
export const Route = createFileRoute("/smery")({
  validateSearch: (s: Record<string, unknown>): { d: Dir } => ({
    d: s.d === "b" || s.d === "c" ? s.d : "a",
  }),
  head: () => ({
    meta: [{ title: "Investio — návrhy designu" }, { name: "robots", content: "noindex" }],
  }),
  component: Directions,
});

const DIRS: { id: Dir; name: string; note: string }[] = [
  { id: "a", name: "A · Grafit", note: "tmavý" },
  { id: "b", name: "B · Bento", note: "světlý i tmavý" },
  { id: "c", name: "C · Časová osa", note: "světlý i tmavý" },
];

function Directions() {
  useLanguageSync();
  const { d } = Route.useSearch();
  const navigate = useNavigate({ from: "/smery" });
  const { theme, toggle } = useTheme();

  return (
    <>
      {d === "a" && <DirectionA />}
      {d === "b" && <DirectionB />}
      {d === "c" && <DirectionC />}

      {/* Direction switcher: floats over every direction, outside its design. */}
      <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/85 p-1 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
          <span className="hidden sm:inline px-3 text-xs text-white/60">Návrh</span>
          {DIRS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                void navigate({ search: { d: x.id } });
                window.scrollTo({ top: 0 });
              }}
              title={x.note}
              className={cn(
                "h-9 rounded-full px-3 sm:px-4 text-[13px] font-medium transition-colors whitespace-nowrap",
                d === x.id ? "bg-white text-black" : "text-white/75 hover:text-white",
              )}
            >
              {x.name}
            </button>
          ))}
          {(d === "b" || d === "c") && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Přepnout světlý / tmavý"
              className="size-9 inline-flex items-center justify-center rounded-full text-white/75 hover:text-white"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
