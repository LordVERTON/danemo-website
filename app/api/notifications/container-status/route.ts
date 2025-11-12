import { NextRequest, NextResponse } from "next/server";
import { containersApi } from "@/lib/database";
import { notifyContainerStatusChange } from "@/lib/container-notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const containerId = String(body.container_id || "").trim();
    const statusOverride = body.status
      ? String(body.status).trim()
      : undefined;
    const customMessage = body.message
      ? String(body.message).trim()
      : undefined;

    if (!containerId) {
      return NextResponse.json(
        { success: false, error: "container_id requis" },
        { status: 400 }
      );
    }

    const container = await containersApi.getById(containerId);
    if (!container) {
      return NextResponse.json(
        { success: false, error: "Conteneur introuvable" },
        { status: 404 }
      );
    }

    const statusToSend = (statusOverride || container.status) as
      | "planned"
      | "departed"
      | "in_transit"
      | "arrived"
      | "delivered"
      | "delayed";

    const result = await notifyContainerStatusChange(
      container.id,
      statusToSend,
      {
        customMessage,
        previousStatus: container.status,
      }
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Échec de l'envoi des notifications conteneur",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[container-status-notification] error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de l'envoi des notifications",
      },
      { status: 500 }
    );
  }
}

