import { NextRequest, NextResponse } from "next/server"
import { getTariffItemsForLang } from "@/lib/tariff-items"

export async function GET(request: NextRequest) {
  const language = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "fr"
  return NextResponse.json({ success: true, data: getTariffItemsForLang(language) })
}
