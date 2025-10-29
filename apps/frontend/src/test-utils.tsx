import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";

// Create a custom render function that includes QueryClientProvider
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface TestProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export function TestProviders({
  children,
  queryClient = createTestQueryClient(),
}: TestProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient, ...renderOptions }: CustomRenderOptions = {}
) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <TestProviders queryClient={queryClient}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing library except render
export * from "@testing-library/react";

// Export our custom render function
export { renderWithProviders as render };
