import { NextResponse } from "next/server";
import { Resend } from "resend";
import StatusNotificationEmail from "@/app/emails/StatusNotificationEmail";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, prenom, reference, stade, trackingUrl, type } = body;

    const emailHtml = await render(
      StatusNotificationEmail({ prenom, reference, stade, trackingUrl, type })
    );

    await resend.emails.send({
      from: "Danemo Notifications <notifications@danemo.be>",
      to,
      subject: `Bonne nouvelle ! Votre ${
        type === "commande" ? "commande" : "conteneur"
      } avance 🚚`,
      html: emailHtml,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

