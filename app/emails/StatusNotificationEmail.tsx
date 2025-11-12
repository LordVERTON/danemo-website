import {
  Html,
  Body,
 Head,
  Container,
  Text,
  Link,
  Preview,
} from "@react-email/components";

interface Props {
  prenom: string;
  reference: string;
  stade: string;
  trackingUrl: string;
  type: "commande" | "conteneur";
}

export default function StatusNotificationEmail({
  prenom,
  reference,
  stade,
  trackingUrl,
  type,
}: Props) {
  const typeLabel = type === "commande" ? "commande" : "conteneur";

  return (
    <Html>
      <Head />
      <Preview>Bonne nouvelle ! Votre {typeLabel} avance 🚚</Preview>
      <Body
        style={{
          backgroundColor: "#f6f9fc",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "600px",
            margin: "0 auto",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <Text style={{ fontSize: "20px", fontWeight: "bold" }}>
            Bonne nouvelle ! Votre {typeLabel} avance 🚚
          </Text>

          <Text>Bonjour {prenom},</Text>

          <Text>
            Votre {typeLabel} <strong>{reference}</strong> avance ! Il est
            maintenant <strong>{stade}</strong>.
          </Text>

          <Text>
            Vous pouvez suivre son trajet ici 👉{" "}
            <Link href={trackingUrl}>{trackingUrl}</Link>
          </Text>

          <Text>
            Merci d’avoir choisi <strong>Danemo</strong> pour cet envoi !
          </Text>

          <Text>
            À très vite,
            <br />
            L’équipe <strong>Danemo SRL</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

