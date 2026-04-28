/**
 * Novakou — Email Templates : Formations (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  successBoxDark, tableDark, tableRowDark,
} from "@/lib/email/layout-dark";

// XSS hardening — every interpolated piece of user-supplied text must go
// through this. `tableRowDark` etc. ship raw HTML so we escape values
// before they reach those helpers.
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── course.purchased → email étudiant ──
export async function sendCoursePurchasedEmail(
  email: string, name: string,
  data: { courseTitle: string; instructorName?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Formation achetée !")}
    ${textDark(`Bonjour ${esc(name)}, vous avez acheté la formation <strong style="color:#F1F5F9;">«&nbsp;${esc(data.courseTitle)}&nbsp;»</strong>.`)}
    ${data.instructorName ? textDark(`Instructeur : <strong style="color:#F1F5F9;">${esc(data.instructorName)}</strong>`) : ""}
    ${buttonDark("Commencer la formation", `${getAppUrl()}/apprenant/mes-formations`, "green")}
  `);
  return sendEmail({ to: email, subject: `Formation achetée — ${data.courseTitle}`, html });
}

// ── course.completed → email étudiant ──
export async function sendCourseCompletedEmail(
  email: string, name: string,
  data: { courseTitle: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Formation terminée !")}
    ${textDark(`Félicitations ${esc(name)} ! Vous avez terminé la formation <strong style="color:#F1F5F9;">«&nbsp;${esc(data.courseTitle)}&nbsp;»</strong>.`)}
    ${successBoxDark("Formation complétée à 100&nbsp;%")}
    ${buttonDark("Voir mon certificat", `${getAppUrl()}/apprenant/certificats`, "green")}
  `);
  return sendEmail({ to: email, subject: `Formation terminée — ${data.courseTitle}`, html });
}

// ── certificate.generated → email étudiant ──
export async function sendCertificateGeneratedEmail(
  email: string, name: string,
  data: { courseTitle: string; certificateUrl?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Certificat généré !")}
    ${textDark(`Bonjour ${esc(name)}, votre certificat pour la formation <strong style="color:#F1F5F9;">«&nbsp;${esc(data.courseTitle)}&nbsp;»</strong> est prêt.`)}
    ${successBoxDark("Certificat disponible")}
    ${buttonDark("Télécharger mon certificat", data.certificateUrl || `${getAppUrl()}/apprenant/certificats`, "green")}
    ${mutedDark("Ce certificat est vérifié et visible sur votre profil public.")}
  `);
  return sendEmail({ to: email, subject: `Certificat — ${data.courseTitle}`, html });
}

// ── course.new_lesson → email étudiants inscrits ──
export async function sendNewLessonEmail(
  email: string, name: string,
  data: { courseTitle: string; lessonTitle?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Nouvelle leçon disponible")}
    ${textDark(`Bonjour ${esc(name)}, une nouvelle leçon a été ajoutée à la formation <strong style="color:#F1F5F9;">«&nbsp;${esc(data.courseTitle)}&nbsp;»</strong>.`)}
    ${data.lessonTitle ? tableDark(tableRowDark("Leçon", esc(data.lessonTitle))) : ""}
    ${buttonDark("Voir la leçon", `${getAppUrl()}/apprenant/mes-formations`, "blue")}
  `);
  return sendEmail({ to: email, subject: `Nouvelle leçon — ${data.courseTitle}`, html });
}

// ── course.reviewed → email instructeur ──
export async function sendCourseReviewedEmail(
  email: string, name: string,
  data: { courseTitle: string; rating: number; comment?: string; reviewerName?: string }
) {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  const html = emailLayoutDark(`
    ${headingDark("Nouvel avis sur votre formation")}
    ${textDark(`Bonjour ${esc(name)}, ${esc(data.reviewerName || "un étudiant")} a laissé un avis sur <strong style="color:#F1F5F9;">«&nbsp;${esc(data.courseTitle)}&nbsp;»</strong>.`)}
    ${tableDark(
      tableRowDark("Note", `<span style="color:#FBBF24;">${stars}</span> (${data.rating}/5)`) +
      (data.comment ? tableRowDark("Commentaire", esc(data.comment)) : "")
    )}
    ${buttonDark("Voir les avis", `${getAppUrl()}/vendeur/avis`)}
  `);
  return sendEmail({ to: email, subject: `Nouvel avis — ${data.courseTitle}`, html });
}
