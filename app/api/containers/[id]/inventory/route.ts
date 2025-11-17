"use server"

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

type OrderRow = Database["public"]["Tables"]["orders"]["Row"]

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Container ID manquant" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id,
        order_number,
        client_name,
        client_email,
        service_type,
        origin,
        destination,
        status,
        value,
        weight,
        created_at
      `
      )
      .eq("container_id", id)
      .order("client_name", { ascending: true })
      .returns<OrderRow[]>()

    if (error) throw error

    const formatted = (data || []).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      client_name: order.client_name,
      client_email: order.client_email,
      service_type: order.service_type,
      origin: order.origin,
      destination: order.destination,
      status: order.status,
      value: order.value,
      weight: order.weight,
      created_at: order.created_at,
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error("Error fetching container inventory:", error)
    return NextResponse.json(
      { success: false, error: "Erreur lors du chargement des articles" },
      { status: 500 }
    )
  }
}

