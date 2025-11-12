"use client";

import { ReactNode } from "react";
import { useSupabaseEmailListener } from "@/app/hooks/useSupabaseEmailListener";

interface Props {
  children: ReactNode;
}

export function SupabaseRealtimeListener({ children }: Props) {
  useSupabaseEmailListener();
  return <>{children}</>;
}

