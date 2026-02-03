"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sales", label: "Sales" },
  { href: "/leader-region", label: "Leader & Region" },
  { href: "/outlets", label: "Outlet" },
  { href: "/reports", label: "Laporan" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#e6e6e6] overflow-x-hidden">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-[#111111] border-b border-[#222222]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="px-3 py-2 text-sm border border-[#2a2a2a] rounded-md bg-[#151515]"
            aria-label="Buka menu"
          >
            ☰
          </button>
          <div className="text-sm font-medium text-[#c9f24b]">
            Sales Dashboard
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex min-w-0">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] border-r border-[#222222] transform transition-transform duration-200 md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-5 py-4 border-b border-[#222222] flex items-center justify-between">
            <div className="text-lg font-semibold text-[#c9f24b]">
              Monitoring
            </div>
            <button
              onClick={() => setOpen(false)}
              className="md:hidden text-[#9aa0a6]"
              aria-label="Tutup menu"
            >
              ✕
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    isActive
                      ? "bg-[#1b1b1b] text-[#c9f24b] border border-[#2a2a2a]"
                      : "text-[#cfd4d8] hover:bg-[#1b1b1b]"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay */}
        {open && (
          <button
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Tutup overlay"
          />
        )}

        <main className="flex-1 min-h-screen md:ml-64 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
