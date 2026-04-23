"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useSupabaseEmailListener() {
  useEffect(() => {
    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://danemo.be";

    const orders = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        async (payload) => {
          const newOrder = payload.new as Record<string, unknown>;
          const oldOrder = payload.old as Record<string, unknown> | undefined;

          const recipientEmail =
            (newOrder.recipient_email as string | null) ||
            (newOrder.client_email as string | null) ||
            (newOrder.user_email as string | null) ||
            (newOrder.email as string | null) ||
            null;

          if (!newOrder.status || !recipientEmail) return;
          if (oldOrder && newOrder.status === oldOrder.status) return;

          const reference =
            (newOrder.order_number as string | undefined) ||
            (newOrder.reference as string | undefined) ||
            String(newOrder.id || "commande");

          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: recipientEmail,
              prenom:
                (newOrder.recipient_name as string | undefined) ||
                (newOrder.client_name as string | undefined) ||
                (newOrder.user_firstname as string | undefined) ||
                (newOrder.full_name as string | undefined) ||
                "Client",
              reference,
              status: newOrder.status,
              trackingUrl: `${appBaseUrl}/tracking?tracking=${encodeURIComponent(reference)}`,
              type: "commande",
            }),
          });

          if (!response.ok) {
            console.error(
              "[supabase-listener] Failed to send order email notification",
              await response.text()
            );
          }
        }
      )
      .subscribe();

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
      supabase.removeChannel(orders);
      supabase.removeChannel(containers);
    };
  }, []);
}
