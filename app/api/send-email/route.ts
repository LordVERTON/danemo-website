import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/notify";
import {
  buildOrderStatusEmail,
  buildContainerStatusEmail,
  buildGenericUpdateEmail,
  buildTrackingUrl,
  normalizeOrderStatus,
  normalizeContainerStatus,
} from "@/lib/notification-templates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      to,
      prenom,
      reference,
      stade,
      trackingUrl: trackingUrlBody,
      type,
      status,
      customMessage,
    } = body as {
      to?: string;
      prenom?: string;
      reference?: string;
      stade?: string;
      trackingUrl?: string;
      type?: "commande" | "conteneur";
      status?: string;
      customMessage?: string;
    };

    if (!to || !reference || (type !== "commande" && type !== "conteneur")) {
      return NextResponse.json(
        { ok: false, error: "Champs requis: to, reference, type (commande|conteneur)" },
        { status: 400 }
      );
    }

    const name = prenom || "Client";
    const ref = String(reference);

    let subject: string;
    let html: string;

    if (type === "commande") {
      const trackingUrl =
        trackingUrlBody ||
        buildTrackingUrl({ orderNumber: ref });
      const norm = normalizeOrderStatus(String(status || ""));
      if (norm) {
        const o = buildOrderStatusEmail(norm, {
          recipientName: name,
          orderNumber: ref,
          trackingUrl,
        });
        subject = o.subject;
        html = o.html;
      } else {
        const o = buildGenericUpdateEmail({
          entityLabel: "commande",
          recipientName: name,
          reference: ref,
          humanLine: stade || String(status || "Mise à jour"),
          trackingUrl,
        });
        subject = o.subject;
        html = o.html;
      }
    } else {
      const trackingUrl =
        trackingUrlBody ||
        buildTrackingUrl({ containerCode: ref });
      const norm = normalizeContainerStatus(String(status || ""));
      if (norm) {
        const o = buildContainerStatusEmail(norm, {
          recipientName: name,
          shipmentReference: ref,
          trackingUrl,
          customMessage: customMessage?.trim() || undefined,
        });
        subject = o.subject;
        html = o.html;
      } else {
        const o = buildGenericUpdateEmail({
          entityLabel: "conteneur",
          recipientName: name,
          reference: ref,
          humanLine: stade || String(status || "Mise à jour"),
          trackingUrl,
        });
        subject = o.subject;
        html = o.html;
      }
    }

    await sendEmail(to, subject, html);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur envoi email:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
