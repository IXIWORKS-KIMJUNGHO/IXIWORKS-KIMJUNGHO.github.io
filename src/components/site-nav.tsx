import type { NavId } from "../types.ts";

function itemsFor(current: NavId): { id: NavId; href: string; label: string }[] {
  const home = current === "home";
  return [
    { id: "news", href: "/news.html", label: "News" },
    { id: "work", href: home ? "#work" : "/portfolio.html", label: "Work" },
    { id: "research", href: home ? "#research" : "/#research", label: "Research" },
    { id: "teaching", href: "/teaching/", label: "Teaching" },
    { id: "cv", href: home ? "#cv-archive" : "/#cv-archive", label: "CV" },
  ];
}

export function SiteNav({ current }: { current: NavId }) {
  const homeCurrent = current === "home";
  return (
    <header className="site-header">
      <nav className="nav" aria-label="Primary">
        <a
          className="brand"
          href="/"
          {...(homeCurrent ? { "aria-current": "page" as const } : {})}
        >
          Kim Jungho
        </a>
        {itemsFor(current).map((item) => (
          <a
            key={item.id}
            href={item.href}
            {...(item.id === current
              ? { "aria-current": "page" as const }
              : {})}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
