"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const orderStageLabels: Record<string, string> = {
  pending: "en préparation",
  confirmed: "confirmée",
  in_progress: "en cours de livraison",
  completed: "livrée",
  cancelled: "annulée",
};

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
          const { new: newOrder } = payload;
          const recipientEmail =
            newOrder.recipient_email ||
            newOrder.client_email ||
            newOrder.user_email ||
            newOrder.email ||
            null;

          if (newOrder.status && recipientEmail) {
            const stageLabel =
              orderStageLabels[newOrder.status] || newOrder.status;
            const reference =
              newOrder.order_number ||
              newOrder.reference ||
              newOrder.id ||
              "commande";

            const response = await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: recipientEmail,
                prenom:
                  newOrder.recipient_name ||
                  newOrder.client_name ||
                  newOrder.user_firstname ||
                  newOrder.full_name ||
                  "Client",
                reference,
                stade: stageLabel,
                trackingUrl: `${appBaseUrl}/suivi/${reference}`,
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
        }
      )
      .subscribe();

    const containers = supabase
      .channel("containers-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "containers" },
        async (payload) => {
          const { new: newContainer } = payload;
          if (newContainer.status && newContainer.owner_email) {
            const response = await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: newContainer.owner_email,
                prenom: newContainer.owner_name || "Client",
                reference: newContainer.reference,
                stade: newContainer.status,
                trackingUrl: `${appBaseUrl}/suivi/${newContainer.reference}`,
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orders);
      supabase.removeChannel(containers);
    };
  }, []);
}

