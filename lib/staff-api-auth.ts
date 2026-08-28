import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function hasStaffSession(): Promise<boolean> {
  return Boolean(await getServerSession(authOptions))
}
