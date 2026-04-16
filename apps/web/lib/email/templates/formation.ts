/**
 * FreelanceHigh — Email Templates : Formations (dark mode)
 */

import { sendEmail, getAppUrl } from "@/lib/email";
import {
  emailLayoutDark, headingDark, textDark, buttonDark, mutedDark,
  successBoxDark, tableDark, tableRowDark,
} from "@/lib/email/layout-dark";

// ── course.purchased → email etudiant ──
export async function sendCoursePurchasedEmail(
  email: string, name: string,
  data: { courseTitle: string; instructorName?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Formation achetee !")}
    ${textDark(`Bonjour ${name}, vous avez achete la formation <strong style="color:#F1F5F9;">"${data.courseTitle}"</strong>.`)}
    ${data.instructorName ? textDark(`Instructeur : <strong style="color:#F1F5F9;">${data.instructorName}</strong>`) : ""}
    ${buttonDark("Commencer la formation", `${getAppUrl()}/formations`, "green")}
  `);
  return sendEmail({ to: email, subject: `Formation achetee — ${data.courseTitle}`, html });
}

// ── course.completed → email etudiant ──
export async function sendCourseCompletedEmail(
  email: string, name: string,
  data: { courseTitle: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Formation terminee !")}
    ${textDark(`Felicitations ${name} ! Vous avez termine la formation <strong style="color:#F1F5F9;">"${data.courseTitle}"</strong>.`)}
    ${successBoxDark("Formation completee a 100%")}
    ${buttonDark("Voir mon certificat", `${getAppUrl()}/dashboard/certifications`, "green")}
  `);
  return sendEmail({ to: email, subject: `Formation terminee — ${data.courseTitle}`, html });
}

// ── certificate.generated → email etudiant ──
export async function sendCertificateGeneratedEmail(
  email: string, name: string,
  data: { courseTitle: string; certificateUrl?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Certificat genere !")}
    ${textDark(`Bonjour ${name}, votre certificat pour la formation <strong style="color:#F1F5F9;">"${data.courseTitle}"</strong> est pret.`)}
    ${successBoxDark("Certificat disponible")}
    ${buttonDark("Telecharger mon certificat", data.certificateUrl || `${getAppUrl()}/dashboard/certifications`, "green")}
    ${mutedDark("Ce certificat est verifie et visible sur votre profil public.")}
  `);
  return sendEmail({ to: email, subject: `Certificat — ${data.courseTitle}`, html });
}

// ── course.new_lesson → email etudiants inscrits ──
export async function sendNewLessonEmail(
  email: string, name: string,
  data: { courseTitle: string; lessonTitle?: string }
) {
  const html = emailLayoutDark(`
    ${headingDark("Nouvelle lecon disponible")}
    ${textDark(`Bonjour ${name}, une nouvelle lecon a ete ajoutee a la formation <strong style="color:#F1F5F9;">"${data.courseTitle}"</strong>.`)}
    ${data.lessonTitle ? tableDark(tableRowDark("Lecon", data.lessonTitle)) : ""}
    ${buttonDark("Voir la lecon", `${getAppUrl()}/formations`, "blue")}
  `);
  return sendEmail({ to: email, subject: `Nouvelle lecon — ${data.courseTitle}`, html });
}

// ── course.reviewed → email instructeur ──
export async function sendCourseReviewedEmail(
  email: string, name: string,
  data: { courseTitle: string; rating: number; comment?: string; reviewerName?: string }
) {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  const html = emailLayoutDark(`
    ${headingDark("Nouvel avis sur votre formation")}
    ${textDark(`Bonjour ${name}, ${data.reviewerName || "un etudiant"} a laisse un avis sur <strong style="color:#F1F5F9;">"${data.courseTitle}"</strong>.`)}
    ${tableDark(
      tableRowDark("Note", `<span style="color:#FBBF24;">${stars}</span> (${data.rating}/5)`) +
      (data.comment ? tableRowDark("Commentaire", data.comment) : "")
    )}
    ${buttonDark("Voir les avis", `${getAppUrl()}/dashboard/formations`)}
  `);
  return sendEmail({ to: email, subject: `Nouvel avis — ${data.courseTitle}`, html });
}
