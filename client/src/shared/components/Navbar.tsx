import { useEffect, useRef, useState } from "react";
import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { Logo } from "@/shared/components/Logo";

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === "/") {
        const active = document.activeElement as HTMLElement | null;
        if (active) {
          const tag = active.tagName;
          const isEditable = active.getAttribute("contenteditable") === "true";
          if (tag === "INPUT" || tag === "TEXTAREA" || isEditable) return;
        }
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Placeholder behavior: currently no search backend exists.
    // Keeping the input interactive for future implementation.
    if (searchTerm.trim().length > 0) {
      alert(`Search for: ${searchTerm}`);
    }
  }

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-line
        bg-surface/70 px-5 backdrop-blur-xl backdrop-saturate-150"
    >
      <button
        type="button"
        onClick={onMenuToggle}
        aria-label="Open navigation menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line
          text-ink-soft hover:bg-surface-2 md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <a href="/" className="flex items-center gap-2.5">
        <Logo className="h-8 w-8" />
        <span className="font-display text-[17px] font-bold tracking-tight text-ink">PDFPilot</span>
      </a>

      <form
        onSubmit={handleSubmit}
        className="ml-auto hidden max-w-[420px] flex-1 items-center gap-2 rounded-xl border
          border-line bg-surface-2 px-3 h-9.5 text-ink-faint sm:flex"
      >
        <button
          type="submit"
          aria-label="Search"
          className="flex h-9.5 w-9.5 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-2"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          ref={inputRef}
          id="navbar-search"
          type="text"
          placeholder="Search your files"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink-faint">
          ⌘K
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-3 sm:ml-3">
        <ThemeToggle />
        <div className="h-5.5 w-px bg-line-strong" aria-hidden="true" />
        <div
          className="flex h-8.5 w-8.5 items-center justify-center rounded-full
            bg-gradient-to-br from-indigo via-violet to-coral text-xs font-bold text-white"
          aria-hidden="true"
        >
          PP
        </div>
      </div>
    </header>
  );
}
