"use client";

import { useEffect } from "react";

export function LeadIdBridge({ leadIds }: { leadIds: string[] }) {
  useEffect(() => {
    window.__leadflowLeadIds = leadIds;

    return () => {
      window.__leadflowLeadIds = [];
    };
  }, [leadIds]);

  return null;
}
