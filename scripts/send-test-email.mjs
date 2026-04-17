// One-shot Resend test send. Confirms key + from + branding work end-to-end.
const KEY = "re_3yNBaSkW_LhgU4txac5ztsd18VrbRtQEU";
const TO = process.argv[2] || "contact@pirabellabs.com";

const body = {
  from: "Novakou <contact@novakou.com>",
  to: TO,
  subject: "Test Novakou — branding & API OK",
  html: `<div style="font-family:Manrope,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f7f9fb">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:24px;text-align:center;border-radius:12px">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Novakou</h1>
      <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:12px;letter-spacing:1px">EMAIL DE TEST</p>
    </div>
    <div style="padding:24px;background:#fff;border:1px solid #f3f4f6;border-radius:12px;margin-top:8px">
      <h2 style="color:#191c1e;margin:0 0 12px">Email branding Novakou actif ✓</h2>
      <p style="color:#5c647a;line-height:1.6;margin:0 0 16px">Cet email confirme que :</p>
      <ul style="color:#5c647a;line-height:1.7;margin:0 0 16px;padding-left:20px">
        <li>L'API Resend fonctionne avec la nouvelle clé Novakou</li>
        <li>L'expéditeur est bien <strong>contact@novakou.com</strong></li>
        <li>Les templates utilisent désormais le vert Novakou au lieu du violet FreelanceHigh</li>
      </ul>
      <div style="background:#dcfce7;border:2px solid #006e2f;border-radius:8px;padding:16px;text-align:center;margin-top:16px">
        <p style="color:#006e2f;font-weight:700;margin:0">Code de vérification fictif : <span style="font-size:24px;letter-spacing:6px">472831</span></p>
      </div>
    </div>
  </div>`,
};

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json();
console.log("status:", res.status);
console.log(JSON.stringify(json, null, 2));
