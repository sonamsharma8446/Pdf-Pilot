import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/shared/components/Navbar";
import { Sidebar } from "@/shared/components/Sidebar";

export function DashboardLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50
          focus:rounded-lg focus:bg-indigo focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <Navbar onMenuToggle={() => setSidebarOpen((open) => !open)} />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main id="main-content" className="min-w-0 flex-1 px-7 py-8 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
