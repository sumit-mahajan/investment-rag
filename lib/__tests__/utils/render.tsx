import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { ReactElement, ReactNode } from "react";

// Custom render function that wraps components with necessary providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  function Wrapper({ children }: { children: ReactNode }) {
    // Add any global providers here if needed
    return <>{children}</>;
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render, screen, fireEvent, waitFor };
