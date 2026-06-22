import { redirect } from "next/navigation";

/**
 * Cette route faisait doublon avec la VRAIE fiche mentor publique
 * (`/mentors/[id]`) — elle affichait des mentors codés en dur. On redirige
 * désormais vers la fiche réelle (données + créneaux + réservation réels).
 */
export default async function ApprenantMentorRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/mentors/${id}`);
}
