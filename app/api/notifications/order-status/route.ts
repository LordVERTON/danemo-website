import { NextRequest, NextResponse } from "next/server";
import { ordersApi } from "@/lib/database";
import { notifyOrderStatusChange } from "@/lib/order-notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body.order_id || "").trim();
    const statusOverride = body.status
      ? String(body.status).trim()
      : undefined;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "order_id requis" },
        { status: 400 }
      );
    }

    const order = await ordersApi.getById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const statusToSend = (statusOverride || order.status) as
      | "pending"
      | "confirmed"
      | "in_progress"
      | "completed"
      | "cancelled";

    const result = await notifyOrderStatusChange(order.id, statusToSend);

    if (!result?.success) {
      const errorMessage =
        result && "error" in result && result.error
          ? String(result.error instanceof Error ? result.error.message : result.error)
          : "Échec de l'envoi de la notification";
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[order-status-notification] error", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne lors de l'envoi" },
      { status: 500 }
    );
  }
}

