"use client";

import Link from "next/link";
import { useState } from "react";
import { use } from "react";

function formatFcfa(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}
function toEur(fcfa: number) {
  return Math.round(fcfa / 655.957);
}

const mentorData: Record<string, {
  name: string; initials: string; specialty: string; bio: string; longBio: string;
  rating: number; reviews: number; students: number;
  sessionPriceFcfa: number; sessionPrices: { duration: string; fcfa: number }[];
  badges: string[]; available: boolean; gradientFrom: string; gradientTo: string;
  languages: string[]; expertise: string[]; reviewsList: { author: string; initial: string; rating: number; comment: string; date: string }[];
  slots: { date: string; times: string[] }[];
}> = {
  "kofi-asante": {
    name: "Kofi Asante", initials: "KA", specialty: "Automatisation & No-code",
    bio: "Expert en automatisation des workflows avec n8n, Make et Zapier.",
    longBio: "J'accompagne les freelances et entrepreneurs à automatiser leurs processus métier pour gagner du temps et scaler leur activité. J'ai formé +200 personnes en Afrique francophone depuis 2022.",
    rating: 4.9, reviews: 89, students: 312, sessionPriceFcfa: 35000,
    sessionPrices: [{ duration: "30 min", fcfa: 18000 }, { duration: "1h", fcfa: 35000 }, { duration: "1h30", fcfa: 50000 }],
    badges: ["Top Mentor", "Expert Tech"], available: true,
    gradientFrom: "#1a1a2e", gradientTo: "#16213e",
    languages: ["Français", "Anglais"], expertise: ["n8n", "Make / Integromat", "Zapier", "Airtable", "Notion", "API REST"],
    reviewsList: [
      { author: "Sarah K.", initial: "SK", rating: 5, comment: "Session incroyable ! Kofi m'a aidé à automatiser tout mon onboarding client en 1h. Je recommande à 100%.", date: "8 avr. 2026" },
      { author: "Marc D.", initial: "MD", rating: 5, comment: "Très pédagogue, patient et efficace. J'ai appris plus en 1h qu'en 2 semaines de tutoriels YouTube.", date: "1 avr. 2026" },
    ],
    slots: [
      { date: "Demain, 15 avr.", times: ["10h00", "11h30", "14h00", "16h00"] },
      { date: "Mer. 16 avr.", times: ["9h00", "10h30", "15h00"] },
      { date: "Jeu. 17 avr.", times: ["11h00", "14h30", "17h00"] },
    ],
  },
  "aminata-diallo": {
    name: "Aminata Diallo", initials: "AD", specialty: "Copywriting & Marketing Digital",
    bio: "Copywriter professionnelle avec 7 ans d'expérience.",
    longBio: "Spécialiste du copywriting persuasif et du marketing de contenu pour les marques africaines. J'aide les freelances à créer des messages qui convertissent et à développer leur présence en ligne.",
    rating: 4.8, reviews: 67, students: 198, sessionPriceFcfa: 25000,
    sessionPrices: [{ duration: "30 min", fcfa: 13000 }, { duration: "1h", fcfa: 25000 }],
    badges: ["Vérifié", "Top Mentor"], available: true,
    gradientFrom: "#1b4332", gradientTo: "#081c15",
    languages: ["Français"], expertise: ["Copywriting", "Email marketing", "LinkedIn", "Instagram", "Stratégie de contenu"],
    reviewsList: [
      { author: "Ibou S.", initial: "IS", rating: 5, comment: "Aminata a complètement transformé ma façon de rédiger mes offres. J'ai signé 3 nouveaux clients la semaine suivante !", date: "10 avr. 2026" },
    ],
    slots: [
      { date: "Aujourd'hui, 14 avr.", times: ["16h30", "18h00"] },
      { date: "Demain, 15 avr.", times: ["10h00", "14h00"] },
    ],
  },
};

const defaultMentor = mentorData["kofi-asante"];

export default function MentorBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mentor = mentorData[id] || defaultMentor;

  const [selectedDuration, setSelectedDuration] = useState(mentor.sessionPrices[1]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [topic, setTopic] = useState("");
  const [step, setStep] = useState<"booking" | "confirm" | "success">("booking");

  const handleBook = () => {
    if (!selectedSlot) return;
    setStep("confirm");
  };
  const handleConfirm = () => {
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="p-5 md:p-8 max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-[40px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Session réservée !</h2>
        <p className="text-sm text-[#5c647a] mb-1">
          Votre session avec <strong>{mentor.name}</strong> est confirmée.
        </p>
        {selectedSlot && (
          <p className="text-sm font-semibold text-[#191c1e] mb-6">
            {selectedSlot.date} à {selectedSlot.time} · {selectedDuration.duration}
          </p>
        )}
        <div className="bg-[#006e2f]/5 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-[#5c647a] mb-1">Le lien de la session vous sera envoyé par email et apparaîtra dans :</p>
          <p className="text-sm font-semibold text-[#191c1e]">Mes sessions → Mes mentors</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/apprenant/mentors" className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors bg-white">
            Voir mes sessions
          </Link>
          <Link href="/explorer" className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
            Explorer le catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/apprenant/mentors" className="inline-flex items-center gap-1.5 text-sm text-[#5c647a] hover:text-[#006e2f] font-medium mb-6 transition-colors group">
        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        Retour aux mentors
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left — Mentor profile */}
        <div className="flex-1 min-w-0">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className="h-24" style={{ background: `linear-gradient(135deg, ${mentor.gradientFrom}, ${mentor.gradientTo})` }} />
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-8 mb-4">
                <div
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${mentor.gradientFrom}, ${mentor.gradientTo})` }}
                >
                  {mentor.initials}
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {mentor.badges.map((b) => (
                      <span key={b} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
              <h1 className="text-xl font-extrabold text-[#191c1e] mb-0.5">{mentor.name}</h1>
              <p className="text-sm text-[#5c647a] mb-3">{mentor.specialty}</p>

              <div className="flex items-center gap-4 text-sm mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-yellow-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-bold text-[#191c1e]">{mentor.rating}</span>
                  <span className="text-[#5c647a]">({mentor.reviews} avis)</span>
                </div>
                <span className="text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  {mentor.students} élèves
                </span>
                <span className="text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">translate</span>
                  {mentor.languages.join(", ")}
                </span>
              </div>

              <p className="text-sm text-[#5c647a] leading-relaxed mb-4">{mentor.longBio}</p>

              {/* Expertise tags */}
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((e) => (
                  <span key={e} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-[#5c647a]">{e}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#191c1e] text-sm mb-4">Avis des élèves</h2>
            <div className="space-y-4">
              {mentor.reviewsList.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {r.initial}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#191c1e]">{r.author}</p>
                      <span className="text-[10px] text-[#5c647a]">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className="material-symbols-outlined text-yellow-400 text-[12px]" style={{ fontVariationSettings: s <= r.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                      ))}
                    </div>
                    <p className="text-xs text-[#5c647a] leading-relaxed">{r.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Booking widget */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sticky top-24">
            {step === "booking" ? (
              <>
                <h2 className="font-bold text-[#191c1e] mb-5">Réserver une session</h2>

                {/* Duration */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-[#191c1e] mb-2">Durée de la session</p>
                  <div className="space-y-2">
                    {mentor.sessionPrices.map((sp) => (
                      <button
                        key={sp.duration}
                        onClick={() => setSelectedDuration(sp)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          selectedDuration.duration === sp.duration
                            ? "border-[#006e2f] bg-[#006e2f]/5 text-[#006e2f]"
                            : "border-gray-200 text-[#191c1e] hover:border-gray-300"
                        }`}
                      >
                        <span>{sp.duration}</span>
                        <span className="font-extrabold">{formatFcfa(sp.fcfa)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slots */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-[#191c1e] mb-2">Choisir un créneau</p>
                  <div className="space-y-3">
                    {mentor.slots.map((slot) => (
                      <div key={slot.date}>
                        <p className="text-[10px] font-semibold text-[#5c647a] mb-1.5">{slot.date}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {slot.times.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedSlot({ date: slot.date, time })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                selectedSlot?.date === slot.date && selectedSlot?.time === time
                                  ? "bg-[#006e2f] text-white border-[#006e2f]"
                                  : "border-gray-200 text-[#191c1e] hover:border-[#006e2f] hover:text-[#006e2f]"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-[#191c1e] mb-2">Sujet de la session <span className="text-[#5c647a] font-normal">(optionnel)</span></p>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Décrivez votre besoin pour que le mentor se prépare..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs text-[#191c1e] placeholder-[#5c647a]/60 resize-none focus:outline-none focus:border-[#006e2f] transition-colors"
                    rows={3}
                  />
                </div>

                {/* Price summary */}
                <div className="flex justify-between items-center py-3 border-t border-gray-100 mb-4">
                  <span className="text-sm font-bold text-[#191c1e]">Total</span>
                  <div className="text-right">
                    <p className="font-extrabold text-[#006e2f] text-lg">{formatFcfa(selectedDuration.fcfa)}</p>
                    <p className="text-[10px] text-[#5c647a]">≈ {toEur(selectedDuration.fcfa)} €</p>
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={!selectedSlot}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all ${
                    selectedSlot ? "hover:opacity-90" : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  Réserver maintenant
                </button>
              </>
            ) : (
              <>
                {/* Confirmation step */}
                <h2 className="font-bold text-[#191c1e] mb-5">Confirmer la réservation</h2>
                <div className="space-y-3 mb-5">
                  {[
                    { icon: "support_agent", label: "Mentor", value: mentor.name },
                    { icon: "schedule", label: "Durée", value: selectedDuration.duration },
                    { icon: "calendar_month", label: "Date", value: selectedSlot ? `${selectedSlot.date} à ${selectedSlot.time}` : "" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#006e2f] text-[18px]">{row.icon}</span>
                      <div>
                        <p className="text-[10px] text-[#5c647a]">{row.label}</p>
                        <p className="text-sm font-semibold text-[#191c1e]">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border border-gray-100 rounded-xl p-4 mb-5">
                  <p className="text-xs text-[#5c647a] mb-1">Méthode de paiement</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {["Orange Money", "Wave", "Carte"].map((m) => (
                      <span key={m} className="text-[10px] font-semibold px-2 py-1 rounded bg-gray-50 text-[#5c647a] border border-gray-100">{m}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-gray-100 mb-4">
                  <span className="font-bold text-[#191c1e]">Total à payer</span>
                  <p className="font-extrabold text-[#006e2f] text-lg">{formatFcfa(selectedDuration.fcfa)}</p>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity mb-2"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  Confirmer & Payer
                </button>
                <button
                  onClick={() => setStep("booking")}
                  className="w-full py-2.5 text-sm text-[#5c647a] hover:text-[#191c1e] font-medium transition-colors"
                >
                  ← Modifier
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
