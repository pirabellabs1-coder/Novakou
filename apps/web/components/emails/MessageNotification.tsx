// Email template for unread message notifications
// Used with Resend + React Email

interface MessageNotificationProps {
  recipientName: string;
  senderNames: string[];
  messageCount: number;
  messagesUrl: string;
}

export function MessageNotificationEmail({
  recipientName,
  senderNames,
  messageCount,
  messagesUrl,
}: MessageNotificationProps) {
  const senderList = senderNames.length <= 3
    ? senderNames.join(", ")
    : `${senderNames.slice(0, 2).join(", ")} et ${senderNames.length - 2} autre(s)`;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ color: "#6C2BD9", fontSize: "24px", margin: 0 }}>Novakou</h1>
      </div>

      <div style={{ backgroundColor: "#f8f9fa", borderRadius: "12px", padding: "32px" }}>
        <h2 style={{ fontSize: "18px", color: "#1a1a1a", marginTop: 0 }}>
          Bonjour {recipientName},
        </h2>

        <p style={{ fontSize: "14px", color: "#4a4a4a", lineHeight: "1.6" }}>
          Vous avez <strong>{messageCount} message{messageCount > 1 ? "s" : ""} non lu{messageCount > 1 ? "s" : ""}</strong> de {senderList}.
        </p>

        <div style={{ textAlign: "center", margin: "24px 0" }}>
          <a
            href={messagesUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#6C2BD9",
              color: "#ffffff",
              padding: "12px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Voir mes messages
          </a>
        </div>

        <p style={{ fontSize: "12px", color: "#999", marginBottom: 0 }}>
          Vous recevez cet email car vous avez des messages non lus sur Novakou.
          Vous pouvez desactiver ces notifications dans vos parametres.
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: "24px" }}>
        <p style={{ fontSize: "11px", color: "#bbb" }}>
          &copy; 2026 Novakou. Tous droits reserves.
        </p>
      </div>
    </div>
  );
}
