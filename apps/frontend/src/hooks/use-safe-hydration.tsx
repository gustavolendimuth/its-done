"use client";

import { useEffect, useState } from "react";

// Hook for safe hydration with icons
export function useSafeHydration() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
