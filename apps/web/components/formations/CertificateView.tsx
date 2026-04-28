/**
 * CertificateView — rendu élégant et "grande école" du certificat Novakou.
 *
 * Palette : ivoire (#fbfaf3) + vert forêt (#0d3b1f) + or champagne (#c9a961).
 * Typo : Playfair Display (serif) + Cormorant Garamond (italique) + Inter.
 * Ornements : 4 coins gravés, double bordure or, médaillon central, ruban
 * latin "Scientia · Ars · Industria", signatures calligraphiques.
 *
 * Cette vue est partagée par /certificat/[code] (réelle) et /certificat/exemple
 * (aperçu), ce qui garantit que le design reste cohérent partout.
 */

import * as React from "react";

export interface CertificateViewProps {
  studentName: string;
  formationTitle: string;
  instructorName?: string | null;
  /** Date d'émission */
  issuedAt: Date;
  /** Score 0-100 */
  score: number;
  /** Nombre de leçons couvertes */
  totalLessons: number;
  /** Code public unique de vérification */
  code: string;
  /** Si true, affiche le bandeau "Aperçu — données fictives" */
  isPreview?: boolean;
  /** Si true, affiche un overlay révoqué */
  isRevoked?: boolean;
}

// ── Honorific mention based on score ────────────────────────────────────
function honorific(score: number): { latin: string; french: string } | null {
  if (score >= 95) return { latin: "Summa cum Laude", french: "Avec les plus grands honneurs" };
  if (score >= 90) return { latin: "Magna cum Laude", french: "Avec grande distinction" };
  if (score >= 80) return { latin: "Cum Laude", french: "Avec distinction" };
  return null;
}

function formatLongDate(d: Date): string {
  // "le vingt-huit avril deux mille vingt-six" style FR formel
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Decorative SVG : ornement de coin ────────────────────────────────────
function CornerOrnament({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)` }}
      className="text-[#c9a961]"
      aria-hidden
    >
      {/* Volute principale */}
      <path
        d="M8 8 L8 32 Q8 40 16 40 Q24 40 24 32 Q24 24 32 24 L40 24"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      {/* Volute secondaire */}
      <path
        d="M8 8 L32 8 Q40 8 40 16 Q40 24 32 24 Q24 24 24 32 L24 40"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      {/* Petits points décoratifs */}
      <circle cx="40" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="40" r="1.5" fill="currentColor" />
      <circle cx="28" cy="28" r="1" fill="currentColor" />
      {/* Petit losange */}
      <path
        d="M48 8 L52 12 L48 16 L44 12 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M8 48 L12 52 L8 56 L4 52 Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

// ── Médaillon central avec monogramme NK ─────────────────────────────────
function NovakouMedallion() {
  return (
    <div className="relative flex items-center justify-center">
      <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
        {/* Anneau extérieur or */}
        <circle
          cx="55"
          cy="55"
          r="52"
          fill="none"
          stroke="#c9a961"
          strokeWidth="1.5"
        />
        <circle
          cx="55"
          cy="55"
          r="48"
          fill="none"
          stroke="#c9a961"
          strokeWidth="0.6"
        />
        {/* Couronne de laurier — feuilles gauche */}
        {[
          { cx: 12, cy: 55, r: 4, rotate: -90 },
          { cx: 16, cy: 40, r: 3.5, rotate: -70 },
          { cx: 22, cy: 28, r: 3, rotate: -50 },
          { cx: 16, cy: 70, r: 3.5, rotate: -110 },
          { cx: 22, cy: 82, r: 3, rotate: -130 },
        ].map((leaf, i) => (
          <ellipse
            key={`l-${i}`}
            cx={leaf.cx}
            cy={leaf.cy}
            rx={leaf.r}
            ry={leaf.r * 2.5}
            fill="#c9a961"
            opacity="0.55"
            transform={`rotate(${leaf.rotate} ${leaf.cx} ${leaf.cy})`}
          />
        ))}
        {/* Couronne de laurier — feuilles droite (miroir) */}
        {[
          { cx: 98, cy: 55, r: 4, rotate: 90 },
          { cx: 94, cy: 40, r: 3.5, rotate: 70 },
          { cx: 88, cy: 28, r: 3, rotate: 50 },
          { cx: 94, cy: 70, r: 3.5, rotate: 110 },
          { cx: 88, cy: 82, r: 3, rotate: 130 },
        ].map((leaf, i) => (
          <ellipse
            key={`r-${i}`}
            cx={leaf.cx}
            cy={leaf.cy}
            rx={leaf.r}
            ry={leaf.r * 2.5}
            fill="#c9a961"
            opacity="0.55"
            transform={`rotate(${leaf.rotate} ${leaf.cx} ${leaf.cy})`}
          />
        ))}
        {/* Disque central vert profond */}
        <circle cx="55" cy="55" r="34" fill="#0d3b1f" />
        <circle
          cx="55"
          cy="55"
          r="34"
          fill="none"
          stroke="#c9a961"
          strokeWidth="0.8"
        />
      </svg>
      {/* Monogramme NK posé en absolu */}
      <span
        className="absolute text-[28px] font-bold text-[#c9a961]"
        style={{
          fontFamily: "'Playfair Display', 'Times New Roman', serif",
          letterSpacing: "0.02em",
        }}
      >
        NK
      </span>
    </div>
  );
}

// ── Divider ornemental — losange + lignes ───────────────────────────────
function OrnamentalDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-5" aria-hidden>
      <span
        className="h-px flex-1 max-w-[80px]"
        style={{
          background:
            "linear-gradient(to right, transparent, #c9a961 50%, #c9a961)",
        }}
      />
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M7 0 L14 7 L7 14 L0 7 Z" fill="#c9a961" opacity="0.85" />
        <path d="M7 3 L11 7 L7 11 L3 7 Z" fill="#fbfaf3" />
      </svg>
      <span
        className="h-px flex-1 max-w-[80px]"
        style={{
          background:
            "linear-gradient(to left, transparent, #c9a961 50%, #c9a961)",
        }}
      />
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────
export default function CertificateView({
  studentName,
  formationTitle,
  instructorName,
  issuedAt,
  score,
  totalLessons,
  code,
  isPreview = false,
  isRevoked = false,
}: CertificateViewProps) {
  const issuedDate = formatLongDate(issuedAt);
  const honor = honorific(score);

  return (
    <div
      className="min-h-screen py-8 md:py-14 px-4"
      style={{
        background:
          "linear-gradient(135deg, #f0eee3 0%, #fbfaf3 50%, #f5f1e0 100%)",
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      }}
    >
      {/* Embed Google Fonts — only for the certificate page (no impact on the rest of the app) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@500;700&display=swap"
        rel="stylesheet"
      />

      {/* Aperçu banner */}
      {isPreview && (
        <div className="max-w-[920px] mx-auto mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
          <span
            className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5 flex-shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            preview
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 mb-0.5">
              Aperçu — données fictives
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Voici à quoi ressemblera le certificat de vos apprenants. Il leur
              sera délivré automatiquement à 100 % de progression.
            </p>
          </div>
        </div>
      )}

      {/* ─── Certificate paper ─────────────────────────────────────────── */}
      <div className="max-w-[920px] mx-auto">
        <div
          className="relative bg-[#fbfaf3] shadow-2xl"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(201, 169, 97, 0.04) 0%, transparent 60%), radial-gradient(circle at 80% 90%, rgba(13, 59, 31, 0.03) 0%, transparent 60%)",
          }}
        >
          {/* Outer gold border (double line) */}
          <div
            className="absolute inset-3"
            style={{
              border: "2px solid #c9a961",
              pointerEvents: "none",
            }}
          />
          <div
            className="absolute inset-[14px]"
            style={{
              border: "1px solid #c9a961",
              opacity: 0.4,
              pointerEvents: "none",
            }}
          />
          {/* Inner forest-green hairline */}
          <div
            className="absolute inset-7"
            style={{
              border: "0.5px solid #0d3b1f",
              opacity: 0.15,
              pointerEvents: "none",
            }}
          />

          {/* Corner ornaments */}
          <div className="absolute top-5 left-5">
            <CornerOrnament rotate={0} />
          </div>
          <div className="absolute top-5 right-5">
            <CornerOrnament rotate={90} />
          </div>
          <div className="absolute bottom-5 left-5">
            <CornerOrnament rotate={-90} />
          </div>
          <div className="absolute bottom-5 right-5">
            <CornerOrnament rotate={180} />
          </div>

          {/* Body */}
          <div className="relative z-10 px-8 md:px-16 py-12 md:py-20 text-center">
            {/* Latin motto top */}
            <p
              className="text-[#c9a961] text-[10px] md:text-xs uppercase mb-2"
              style={{
                fontFamily: "'Cinzel', 'Playfair Display', serif",
                letterSpacing: "0.45em",
              }}
            >
              Scientia · Ars · Industria
            </p>

            {/* Brand */}
            <p
              className="text-[#0d3b1f] text-2xl md:text-3xl mt-1"
              style={{
                fontFamily: "'Cinzel', 'Playfair Display', serif",
                fontWeight: 700,
                letterSpacing: "0.18em",
              }}
            >
              NOVAKOU
            </p>
            <p
              className="text-[#5c5c5c] text-[10px] md:text-[11px] mt-1.5 italic"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                letterSpacing: "0.05em",
              }}
            >
              Académie des créateurs digitaux d&apos;Afrique francophone
            </p>

            <OrnamentalDivider />

            {/* Certificate type */}
            <p
              className="text-[#0d3b1f] text-sm md:text-base mb-2"
              style={{
                fontFamily: "'Cinzel', 'Playfair Display', serif",
                fontWeight: 500,
                letterSpacing: "0.32em",
              }}
            >
              CERTIFICAT DE COMPLÉTION
            </p>

            {/* Body — phrase d'attestation */}
            <p
              className="text-[#3a3a3a] text-base md:text-lg mt-7 mb-2 italic"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              Le présent diplôme atteste que
            </p>

            {/* Student name — ENORME en serif */}
            <h1
              className="text-[#0d3b1f] mb-4 leading-tight"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                fontWeight: 700,
                fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
                letterSpacing: "-0.01em",
              }}
            >
              {studentName}
            </h1>

            {/* Underline ornement */}
            <div className="flex items-center justify-center gap-2 mb-5" aria-hidden>
              <span className="h-px w-12 bg-[#c9a961]" />
              <svg width="8" height="8" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" fill="#c9a961" />
              </svg>
              <span className="h-px w-12 bg-[#c9a961]" />
            </div>

            <p
              className="text-[#3a3a3a] text-base md:text-lg italic mb-3"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              a complété avec succès l&apos;intégralité de la formation
            </p>

            {/* Formation title */}
            <h2
              className="text-[#0d3b1f] mb-4 leading-snug px-4"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                fontWeight: 600,
                fontStyle: "italic",
                fontSize: "clamp(1.3rem, 3vw, 1.9rem)",
              }}
            >
              « {formationTitle} »
            </h2>

            {instructorName && (
              <p
                className="text-[#5c5c5c] text-sm italic mb-1"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                }}
              >
                sous la direction de{" "}
                <span className="text-[#0d3b1f] font-semibold not-italic">
                  {instructorName}
                </span>
              </p>
            )}

            {/* Honorific (if score >= 80) */}
            {honor && (
              <div
                className="inline-flex flex-col items-center mt-6 px-6 py-3"
                style={{
                  border: "1px solid #c9a961",
                  background: "rgba(201, 169, 97, 0.06)",
                }}
              >
                <p
                  className="text-[#c9a961] text-[10px] uppercase tracking-[0.3em] mb-1"
                  style={{ fontFamily: "'Cinzel', serif", fontWeight: 500 }}
                >
                  Mention
                </p>
                <p
                  className="text-[#0d3b1f] text-base md:text-lg italic"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                  }}
                >
                  {honor.latin}
                </p>
                <p className="text-[#5c5c5c] text-[10px] tracking-wide">
                  {honor.french}
                </p>
              </div>
            )}

            <OrnamentalDivider />

            {/* Medallion + signatures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mt-8">
              {/* Left signature : instructor */}
              <div className="text-center order-2 md:order-1">
                <p
                  className="text-[#0d3b1f] text-2xl md:text-[28px] mb-1"
                  style={{
                    fontFamily: "'Caveat', 'Brush Script MT', cursive",
                  }}
                >
                  {instructorName ?? "Pirabel Labs"}
                </p>
                <div className="h-px w-32 bg-[#0d3b1f] mx-auto mb-1.5 opacity-60" />
                <p
                  className="text-[#5c5c5c] text-[9px] uppercase tracking-[0.2em]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {instructorName ? "Formateur" : "Direction"}
                </p>
              </div>

              {/* Center medallion */}
              <div className="flex flex-col items-center order-1 md:order-2">
                <NovakouMedallion />
                <p
                  className="text-[#c9a961] text-[9px] uppercase tracking-[0.3em] mt-3"
                  style={{ fontFamily: "'Cinzel', serif", fontWeight: 500 }}
                >
                  Sceau officiel
                </p>
              </div>

              {/* Right signature : Pirabel Labs */}
              <div className="text-center order-3">
                <p
                  className="text-[#0d3b1f] text-2xl md:text-[28px] mb-1"
                  style={{
                    fontFamily: "'Caveat', 'Brush Script MT', cursive",
                  }}
                >
                  Pirabel Labs
                </p>
                <div className="h-px w-32 bg-[#0d3b1f] mx-auto mb-1.5 opacity-60" />
                <p
                  className="text-[#5c5c5c] text-[9px] uppercase tracking-[0.2em]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Fondateur · Novakou
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div
              className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
              style={{
                borderTop: "1px solid rgba(201, 169, 97, 0.4)",
                paddingTop: "1.25rem",
              }}
            >
              <div>
                <p
                  className="text-[#c9a961] text-[9px] uppercase tracking-[0.25em] mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Délivré le
                </p>
                <p
                  className="text-[#0d3b1f] text-sm font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {issuedDate}
                </p>
              </div>
              <div>
                <p
                  className="text-[#c9a961] text-[9px] uppercase tracking-[0.25em] mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Score
                </p>
                <p
                  className="text-[#0d3b1f] text-sm font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {score} / 100
                </p>
              </div>
              <div>
                <p
                  className="text-[#c9a961] text-[9px] uppercase tracking-[0.25em] mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Leçons
                </p>
                <p
                  className="text-[#0d3b1f] text-sm font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {totalLessons}
                </p>
              </div>
            </div>

            {/* Verification footer */}
            <div className="mt-8 pt-4">
              <p
                className="text-[#5c5c5c] text-[10px] uppercase tracking-[0.25em] mb-1.5"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Code de vérification
              </p>
              <p className="font-mono tabular-nums text-[#0d3b1f] text-xs tracking-wider mb-1">
                {code}
              </p>
              <p
                className="text-[#5c5c5c] text-[10px] italic"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                }}
              >
                Vérifiez l&apos;authenticité sur novakou.com/certificat/{code}
              </p>
            </div>
          </div>

          {/* Revoked overlay */}
          {isRevoked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
              <div
                className="text-red-700 text-6xl md:text-8xl font-bold uppercase tracking-widest"
                style={{
                  transform: "rotate(-12deg)",
                  border: "6px solid #b91c1c",
                  padding: "1rem 2.5rem",
                  background: "rgba(255,255,255,0.9)",
                  fontFamily: "'Cinzel', serif",
                }}
              >
                Révoqué
              </div>
            </div>
          )}
        </div>

        {/* Verification helper card (visible to user, not part of the cert) */}
        {!isPreview && (
          <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-[#c9a961]/30">
            <p
              className="text-[#0d3b1f] text-xs uppercase tracking-[0.25em] font-semibold mb-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              ✓ Certificat authentifié
            </p>
            <p className="text-[#5c5c5c] text-xs">
              Délivré et vérifié par Novakou. Pour toute question :{" "}
              <a
                href="mailto:support@novakou.com"
                className="text-[#0d3b1f] font-semibold hover:underline"
              >
                support@novakou.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
