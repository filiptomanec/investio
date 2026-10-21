import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

// The mark: a sprout, money that grows, in a deep green rounded tile.
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-2xl" aria-label="Investio">
      <span className="grid size-9 place-items-center rounded-2xl bg-(--b-badge) text-(--b-mint)">
        <Sprout className="size-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-(--b-ink)">Investio</span>
    </Link>
  );
}
