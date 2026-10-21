import { Link } from "@tanstack/react-router";

// The mark is a compounding curve: flat at first, then bending upward, with a
// dot on today's value. Ink tile, mint curve; it inverts with the theme.
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-foreground" />
      <path
        d="M7 23.5 C 13 23, 18 21.5, 21.5 16.5 S 24.5 10, 25 8.5"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="stroke-brand"
      />
      <circle cx="25" cy="8.5" r="2.6" className="fill-background" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md" aria-label="Investio">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-foreground">Investio</span>
    </Link>
  );
}
