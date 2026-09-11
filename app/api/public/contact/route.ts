import { NextResponse } from "next/server"
import { z } from "zod"
import { sendEmail } from "@/lib/notify"

const SERVICE_OPTIONS = {
  fret: "Fret maritime et aérien",
  dedouanement: "Dédouanement véhicules, conteneurs et marchandises",
  negoce: "Négoce",
  demenagement: "Déménagement international",
  commerce: "Commerce général",
  autre: "Autre demande",
} as const

const contactSchema = z.object({
  nom: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  telephone: z.string().trim().max(40).optional(),
  service: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.enum(["fret", "dedouanement", "negoce", "demenagement", "commerce", "autre"]).optional(),
  ),
  sujet: z.string().trim().max(160).optional(),
  message: z.string().trim().min(1).max(5_000),
  website: z.string().max(0).optional(),
})

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!)
}

export async function POST(request: Request) {
  try {
    const payload = contactSchema.safeParse(await request.json())

    if (!payload.success) {
      return NextResponse.json(
        { success: false, error: "Veuillez vérifier les informations saisies." },
        { status: 400 },
      )
    }

    const { nom, email, telephone, service, sujet, message } = payload.data
    const serviceLabel = service ? SERVICE_OPTIONS[service] : "Non précisé"
    const mailSubject = (sujet || `Demande de contact — ${serviceLabel}`).replace(/[\r\n]+/g, " ")
    const safeName = escapeHtml(nom)
    const safeEmail = escapeHtml(email)
    const safePhone = escapeHtml(telephone || "Non renseigné")
    const safeService = escapeHtml(serviceLabel)
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br />")

    await sendEmail(
      "info@danemo.be",
      mailSubject,
      `
        <p>Bonjour ${safeName},</p>
        <p>Votre demande a bien été prise en compte. Notre équipe reviendra vers vous rapidement.</p>
        <hr />
        <h2>Nouveau message reçu depuis le site Danemo</h2>
        <p><strong>Nom :</strong> ${safeName}<br />
        <strong>E-mail :</strong> ${safeEmail}<br />
        <strong>Téléphone :</strong> ${safePhone}<br />
        <strong>Service :</strong> ${safeService}</p>
        <p><strong>Message :</strong><br />${safeMessage}</p>
      `,
      { cc: email, replyTo: email },
    )

    return NextResponse.json({ success: true })
  } catch {
    console.error("[contact] Email delivery failed")
    return NextResponse.json(
      { success: false, error: "L’envoi a échoué. Veuillez réessayer dans quelques instants." },
      { status: 500 },
    )
  }
}
