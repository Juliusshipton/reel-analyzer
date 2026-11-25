
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { label: "Home", href: "/dashboard" },
  { label: "YouTube Video Search", href: "/dashboard/youtube-search"},
  { label: "Video Import", href: "/dashboard/video-import"},
  { label: "Calendar", href: "/dashboard/calendar"},
  { label: "Data Assistant", href: "/dashboard/data-assistant"},
  { label: "Saved Videos", href: "/dashboard/saved-videos"},
  { label: "Automated Search", href: "/dashboard/automated-searches" }
];

export default function DashboardNavbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6 py-4">

        <h1 className="shrink-0 text-xl font-bold text-zinc-900 dark:text-white">
          AI Marketing Agent
        </h1>

        <div className="flex items-center gap-2">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
