import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Combine,
  Scissors,
  Minimize2,
  RotateCw,
  Droplet,
  Images,
  FileImage,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/shared/components/Button";

interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, to: "/" },
  { label: "Merge PDF", icon: Combine, to: "/merge" },
  { label: "Split PDF", icon: Scissors, to: "/split" },
  { label: "Compress PDF", icon: Minimize2, to: "/compress" },
  { label: "Rotate PDF", icon: RotateCw, to: "/rotate" },
  { label: "Image to PDF", icon: Images, to: "/image-to-pdf" },
  { label: "PDF to Images", icon: FileImage, to: "/pdf-to-images" },
  { label: "Watermark", icon: Droplet, to: "/watermark" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Tools navigation"
        className={`fixed inset-y-0 left-0 top-16 z-30 flex w-60 flex-col border-r border-line
          bg-surface-2 p-3.5 transition-transform duration-300 md:sticky md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (!item.to) {
              return (
                <div
                  key={item.label}
                  aria-disabled="true"
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium
                    text-ink-faint opacity-60"
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {item.label}
                  <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-faint">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-surface text-indigo font-semibold shadow-sm"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-line bg-surface p-3.5">
          <p className="mb-2.5 text-[12.5px] leading-snug text-ink-soft">
            You're on the Free plan. Upgrade for unlimited file sizes and batch processing.
          </p>
          <Button variant="primary" className="w-full !px-0 text-[13px]">
            Upgrade plan
          </Button>
        </div>
      </aside>
    </>
  );
}
