"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useSupabaseEmailListener() {
  useEffect(() => {
    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://danemo.be";

    // Les e-mails « changement de statut commande » partent du serveur (ordersApi.update),
    // pour éviter les doublons et fonctionner sans Realtime.

    const containers = supabase
      .channel("containers-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "containers" },
        async (payload) => {
          const newContainer = payload.new as Record<string, unknown>;
          const oldContainer = payload.old as Record<string, unknown> | undefined;

          if (!newContainer.status || !newContainer.owner_email) return;
          if (oldContainer && newContainer.status === oldContainer.status) return;

          const reference = String(
            newContainer.reference || newContainer.code || "conteneur"
          );

          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: newContainer.owner_email,
              prenom: (newContainer.owner_name as string | undefined) || "Client",
              reference,
              status: newContainer.status,
              trackingUrl: `${appBaseUrl}/tracking?code=${encodeURIComponent(reference)}`,
              type: "conteneur",
            }),
          });

          if (!response.ok) {
            console.error(
              "[supabase-listener] Failed to send container email notification",
              await response.text()
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(containers);
    };
  }, []);
}
