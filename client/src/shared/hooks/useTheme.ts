import { use } from "react";
import { ThemeContext, type ThemeContextValue } from "@/shared/lib/themeContext";

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
