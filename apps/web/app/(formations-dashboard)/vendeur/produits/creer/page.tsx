"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { RichTextEditor } from "@/components/formations/RichTextEditor";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { FileUploader } from "@/components/formations/FileUploader";

type ProductSubType = "cours_video" | "ebook" | "pdf" | "template" | "audio" | null;

const productTypes: {
  value: ProductSubType;
  kind: "formation" | "product";
  productType?: string;
  label: string;
  description: string;
}[] = [
  { value: "cours_video", kind: "formation", label: "Formation vidéo", description: "Série de leçons vidéo structurées en modules" },
  { value: "ebook", kind: "product", productType: "EBOOK", label: "E-book", description: "Livre numérique au format EPUB" },
  { value: "pdf", kind: "product", productType: "PDF", label: "PDF / Guide", description: "Document PDF téléchargeable" },
  { value: "template", kind: "product", productType: "TEMPLATE", label: "Template", description: "Modèle prêt-à-l'emploi (PSD, AI, Notion)" },
  { value: "audio", kind: "product", productType: "AUDIO", label: "Audio / Podcast", description: "Contenu audio téléchargeable" },
];

const categories = [
  "Développement Web",
  "Marketing Digital",
  "Design Graphique",
  "Entrepreneuriat",
  "Finance & Comptabilité",
  "Langues & Communication",
  "Photographie & Vidéo",
  "Business & Management",
  "Productivité",
  "Intelligence Artificielle",
];

type Lesson = { title: string; duration: number; videoUrl: string };
type Module = { title: string; lessons: Lesson[] };

/** Valide rapidement une URL vidéo (YouTube, Vimeo, .mp4/.webm/.mov, Supabase, Cloudinary). */
function isValidLessonUrl(url: string): boolean {
  if (!url) return false;
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) return false;
  return (
    /youtube\.com\/(watch|embed|shorts)|youtu\.be\//i.test(u) ||
    /vimeo\.com\/|player\.vimeo\.com\//i.test(u) ||
    /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) ||
    u.includes("supabase.co") ||
    u.includes("cloudinary.com")
  );
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CreerProduitPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ProductSubType>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [price, setPrice] = useState(45000);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formation-specific
  const [modules, setModules] = useState<Module[]>([
    { title: "", lessons: [{ title: "", duration: 10, videoUrl: "" }] },
  ]);

  // Product-specific
  const [fileUrl, setFileUrl] = useState("");

  const selected = productTypes.find((p) => p.value === selectedType);
  const isFormation = selected?.kind === "formation";
  const euroEquiv = Math.round(price / 655.957);

  // Dynamic step list based on type
  const steps = isFormation
    ? [
        { num: 1, label: "Basic Info", sub: "Identité & Catégorie" },
        { num: 2, label: "Description", sub: "Contenu pédagogique" },
        { num: 3, label: "Curriculum", sub: "Modules & Leçons" },
        { num: 4, label: "Pricing", sub: "Tarification" },
        { num: 5, label: "Summary", sub: "Review & Launch" },
      ]
    : [
        { num: 1, label: "Basic Info", sub: "Identité & Catégorie" },
        { num: 2, label: "Description", sub: "Contenu & Résumé" },
        { num: 3, label: "File Upload", sub: "Fichier à télécharger" },
        { num: 4, label: "Pricing", sub: "Tarification" },
        { num: 5, label: "Summary", sub: "Review & Launch" },
      ];
  const lastStep = steps.length;

  const createMutation = useMutation({
    mutationFn: (publish: boolean) =>
      fetch("/api/formations/vendeur/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: selected?.kind,
          productType: selected?.productType,
          title, shortDesc, description, category,
          thumbnail: thumbnail || null,
          price: isFree ? 0 : price,
          originalPrice: originalPrice || null,
          isFree,
          publish,
          modules: isFormation ? modules.filter((m) => m.title.trim()) : undefined,
          fileUrl: !isFormation ? fileUrl : undefined,
        }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { setError(res.error); return; }
      router.push("/vendeur/produits");
    },
    onError: () => setError("Erreur serveur — réessayez"),
  });

  const canProceed = (() => {
    if (step === 1) return selectedType !== null && title.trim().length > 0 && category.length > 0;
    if (step === 2) return description.trim().length >= 20;
    if (isFormation && step === 3) return modules.some((m) => m.title.trim() && m.lessons.some((l) => l.title.trim()));
    if (!isFormation && step === 3) return true; // File upload optional
    if (step === lastStep - 1) return isFree || price > 0; // Pricing step (gratuit OU prix > 0)
    return true;
  })();

  const progress = ((step - 1) / (lastStep - 1)) * 100;

  // Curriculum helpers
  const addModule = () => setModules((m) => [...m, { title: "", lessons: [{ title: "", duration: 10, videoUrl: "" }] }]);
  const removeModule = (mIdx: number) => setModules((m) => m.filter((_, i) => i !== mIdx));
  const updateModule = (mIdx: number, title: string) => setModules((m) => m.map((mod, i) => (i === mIdx ? { ...mod, title } : mod)));
  const addLesson = (mIdx: number) =>
    setModules((m) => m.map((mod, i) => (i === mIdx ? { ...mod, lessons: [...mod.lessons, { title: "", duration: 10, videoUrl: "" }] } : mod)));
  const removeLesson = (mIdx: number, lIdx: number) =>
    setModules((m) => m.map((mod, i) => (i === mIdx ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== lIdx) } : mod)));
  const updateLesson = (mIdx: number, lIdx: number, patch: Partial<Lesson>) =>
    setModules((m) =>
      m.map((mod, i) =>
        i === mIdx
          ? { ...mod, lessons: mod.lessons.map((l, j) => (j === lIdx ? { ...l, ...patch } : l)) }
          : mod
      )
    );

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalDuration = modules.reduce((s, m) => s + m.lessons.reduce((ss, l) => ss + (l.duration || 0), 0), 0);

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-12 md:py-16 max-w-[1400px] mx-auto">
        <header className="mb-12 md:mb-16">
          <Link
            href="/vendeur/produits"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Retour aux produits
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#006e2f] mb-2">Espace Instructeur</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-zinc-900 max-w-3xl leading-[1.05]">
            Publier un nouveau produit.
          </h1>
          {selected && (
            <p className="text-sm text-zinc-500 mt-3">
              Type sélectionné : <span className="font-bold text-zinc-900">{selected.label}</span>
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
          {/* Left — Stepper */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-10">
              <div className="space-y-6">
                {steps.map((s) => {
                  const active = step === s.num;
                  const done = step > s.num;
                  return (
                    <button
                      key={s.num}
                      onClick={() => { if (done) setStep(s.num); }}
                      className={`flex items-center gap-4 w-full text-left transition-opacity ${
                        done ? "cursor-pointer hover:opacity-80" : "cursor-default"
                      }`}
                      disabled={!done}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          active
                            ? "bg-[#006e2f] text-white"
                            : done
                            ? "bg-[#22c55e] text-[#004b1e]"
                            : "bg-[#e8e8e8] text-zinc-400"
                        }`}
                      >
                        {done ? <span className="material-symbols-outlined text-[14px]">check</span> : String(s.num).padStart(2, "0")}
                      </div>
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-[#006e2f]" : done ? "text-zinc-700" : "text-zinc-400"}`}>
                          {s.label}
                        </p>
                        <p className="text-xs text-zinc-400">{s.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-6 bg-[#f3f3f4]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Progression</p>
                <div className="h-[2px] w-full bg-[#e8e8e8] mb-3">
                  <div className="h-full bg-[#22c55e] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs tabular-nums text-zinc-600">{Math.round(progress)}% — Étape {step}/{lastStep}</p>
              </div>

              {/* Curriculum summary (only for formations) */}
              {isFormation && step >= 3 && modules.some((m) => m.title.trim()) && (
                <div className="p-6 bg-zinc-900 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#22c55e] mb-3">Curriculum</p>
                  <div className="space-y-2 tabular-nums text-xs">
                    <div className="flex justify-between"><span className="text-zinc-400">Modules</span><span className="font-bold">{modules.filter((m) => m.title.trim()).length}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Leçons</span><span className="font-bold">{totalLessons}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Durée</span><span className="font-bold">{totalDuration} min</span></div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right — Form */}
          <section className="lg:col-span-9 space-y-10">
            {/* ── STEP 1 — Basic info ── */}
            {step === 1 && (
              <div className="bg-white p-8 md:p-12 space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type de produit</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {productTypes.map((pt) => (
                      <button
                        key={pt.value}
                        onClick={() => setSelectedType(pt.value)}
                        className={`flex items-start gap-4 p-5 text-left transition-all border ${
                          selectedType === pt.value
                            ? "bg-[#006e2f] text-white border-[#006e2f]"
                            : "bg-[#f3f3f4] border-transparent hover:bg-[#e8e8e8]"
                        }`}
                      >
                        <div className={`w-1 flex-shrink-0 self-stretch ${selectedType === pt.value ? "bg-[#6bff8f]" : "bg-[#bccbb9]"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold tracking-tight ${selectedType === pt.value ? "text-white" : "text-zinc-900"}`}>{pt.label}</p>
                          <p className={`text-xs mt-1 ${selectedType === pt.value ? "text-white/70" : "text-zinc-500"}`}>{pt.description}</p>
                        </div>
                        {selectedType === pt.value && (
                          <span className="material-symbols-outlined text-[18px] text-[#6bff8f] mt-0.5">check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedType && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-[#e8e8e8]">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Titre du produit</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Maîtrisez le Marketing Digital"
                          className="w-full bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-3.5 px-5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Catégorie</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-3.5 px-5 text-sm text-zinc-900 outline-none appearance-none cursor-pointer">
                          <option value="" className="text-zinc-400">Sélectionner…</option>
                          {categories.map((c) => <option key={c} value={c} className="text-zinc-900">{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Description courte</label>
                        <input type="text" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Une phrase qui accroche" maxLength={150}
                          className="w-full bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-3.5 px-5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none" />
                        <p className="text-[10px] text-zinc-400 tabular-nums">{shortDesc.length}/150</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Image de couverture</label>
                      <ImageUploader
                        value={thumbnail}
                        onChange={setThumbnail}
                        folder="portfolio"
                        aspectClass="aspect-square"
                        helper="Recommandé : 1280×720px · JPG ou PNG · Max 5 MB"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2 — Description ── */}
            {step === 2 && (
              <div className="bg-white p-8 md:p-12 space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">02 / Description</p>
                  <h2 className="text-2xl font-extrabold tracking-tighter text-zinc-900">
                    {isFormation ? "Contenu pédagogique." : "Contenu du produit."}
                  </h2>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {isFormation ? "Décrivez votre formation" : "Décrivez votre produit"}
                  </label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder={isFormation
                      ? "Que vont apprendre les apprenants ? À qui s'adresse cette formation ? Quels sont les prérequis ? Vous pouvez ajouter des titres, des listes, des images, des liens…"
                      : "Ce que contient votre produit, pour qui, et pourquoi il est unique. Ajoutez des images, des sections, des liens vers des exemples…"}
                    minHeight={360}
                  />
                  <p className={`text-[10px] tabular-nums uppercase tracking-widest ${description.replace(/<[^>]*>/g, "").trim().length < 20 ? "text-[#ba1a1a]" : "text-zinc-400"}`}>
                    {description.replace(/<[^>]*>/g, "").trim().length} caractères {description.replace(/<[^>]*>/g, "").trim().length < 20 && "· minimum 20"}
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 3 — Curriculum (formations) OR File (products) ── */}
            {step === 3 && isFormation && (
              <div className="bg-white p-8 md:p-12 space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">03 / Curriculum</p>
                  <h2 className="text-2xl font-extrabold tracking-tighter text-zinc-900">Modules &amp; Leçons.</h2>
                  <p className="text-sm text-zinc-500">
                    Structurez votre formation en modules. Pour chaque leçon, ajoutez le titre, la durée et le lien vidéo (YouTube, Vimeo ou MP4). Le lien est optionnel — vous pourrez l&apos;ajouter plus tard depuis l&apos;éditeur de cours.
                  </p>
                </div>

                <div className="space-y-6">
                  {modules.map((mod, mIdx) => (
                    <div key={mIdx} className="border border-zinc-100">
                      <div className="flex items-center gap-4 px-5 py-4 bg-[#f3f3f4] border-l-4 border-[#22c55e]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-16 flex-shrink-0">
                          Mod {String(mIdx + 1).padStart(2, "0")}
                        </span>
                        <input type="text" value={mod.title} onChange={(e) => updateModule(mIdx, e.target.value)} placeholder="Titre du module…"
                          className="flex-1 bg-transparent border-none text-sm font-bold tracking-tight text-zinc-900 placeholder:text-zinc-400 outline-none" />
                        {modules.length > 1 && (
                          <button onClick={() => removeModule(mIdx)} className="p-1 text-zinc-400 hover:text-[#ba1a1a] transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-zinc-50">
                        {mod.lessons.map((lesson, lIdx) => {
                          const urlValid = !lesson.videoUrl.trim() || isValidLessonUrl(lesson.videoUrl);
                          return (
                            <div key={lIdx} className="px-5 py-3 hover:bg-[#f9f9f9] transition-colors space-y-2">
                              {/* Ligne titre + durée */}
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[16px] text-[#22c55e]">play_circle</span>
                                <span className="text-[9px] tabular-nums text-zinc-400 w-6">
                                  {String(lIdx + 1).padStart(2, "0")}
                                </span>
                                <input type="text" value={lesson.title} onChange={(e) => updateLesson(mIdx, lIdx, { title: e.target.value })} placeholder="Titre de la leçon…"
                                  className="flex-1 bg-transparent border-none text-sm text-zinc-700 placeholder:text-zinc-400 outline-none" />
                                <div className="flex items-center gap-1">
                                  <input type="number" value={lesson.duration} onChange={(e) => updateLesson(mIdx, lIdx, { duration: Number(e.target.value) })} min="0"
                                    className="w-14 bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-1.5 px-2 text-xs tabular-nums text-right outline-none" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">min</span>
                                </div>
                                {mod.lessons.length > 1 && (
                                  <button onClick={() => removeLesson(mIdx, lIdx)} className="p-1 text-zinc-300 hover:text-[#ba1a1a] transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                  </button>
                                )}
                              </div>
                              {/* Ligne URL vidéo (YouTube / Vimeo / lien direct) */}
                              <div className="flex items-center gap-3 pl-9">
                                <span className="material-symbols-outlined text-[14px] text-zinc-300">link</span>
                                <input
                                  type="url"
                                  value={lesson.videoUrl}
                                  onChange={(e) => updateLesson(mIdx, lIdx, { videoUrl: e.target.value })}
                                  placeholder="URL vidéo : YouTube, Vimeo ou lien .mp4 (optionnel — modifiable plus tard)"
                                  className={`flex-1 bg-[#fafafa] border-none focus:ring-1 py-1.5 px-3 text-xs text-zinc-700 placeholder:text-zinc-400 outline-none transition-shadow ${
                                    urlValid ? "focus:ring-[#22c55e]" : "ring-1 ring-rose-300 focus:ring-rose-400"
                                  }`}
                                />
                                {lesson.videoUrl.trim() && urlValid && (
                                  <span className="material-symbols-outlined text-[14px] text-[#22c55e]">check_circle</span>
                                )}
                              </div>
                              {!urlValid && (
                                <p className="pl-9 text-[10px] text-rose-600 font-medium">
                                  Format non reconnu — utilisez YouTube, Vimeo ou un lien direct .mp4/.webm/.mov
                                </p>
                              )}
                            </div>
                          );
                        })}
                        <button onClick={() => addLesson(mIdx)} className="w-full flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#006e2f] hover:bg-[#22c55e]/5 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          Ajouter une leçon
                        </button>
                      </div>
                    </div>
                  ))}

                  <button onClick={addModule} className="w-full py-4 border-2 border-dashed border-[#bccbb9] text-[10px] font-bold uppercase tracking-widest text-[#006e2f] hover:bg-[#22c55e]/5 transition-colors">
                    + Ajouter un module
                  </button>
                </div>

                <div className="p-5 bg-[#f3f3f4] border-l-4 border-[#22c55e]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-2">Prochaine étape</p>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    Après la création, ouvrez la formation pour uploader les vidéos, PDFs et ressources de chaque leçon depuis l&apos;éditeur.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && !isFormation && (
              <div className="bg-white p-8 md:p-12 space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">03 / File Upload</p>
                  <h2 className="text-2xl font-extrabold tracking-tighter text-zinc-900">Fichier téléchargeable.</h2>
                  <p className="text-sm text-zinc-500">
                    {selected?.productType === "EBOOK" && "L'apprenant téléchargera ce fichier après achat."}
                    {selected?.productType === "PDF" && "L'apprenant téléchargera ce PDF après achat."}
                    {selected?.productType === "TEMPLATE" && "L'apprenant téléchargera ce template (ZIP recommandé)."}
                    {selected?.productType === "AUDIO" && "L'apprenant téléchargera ce fichier audio."}
                  </p>
                </div>

                <FileUploader
                  value={fileUrl}
                  onChange={setFileUrl}
                  productType={(selected?.productType as "EBOOK" | "PDF" | "TEMPLATE" | "AUDIO") ?? "PDF"}
                />

                <div className="p-5 bg-[#f3f3f4] border-l-4 border-[#22c55e]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-2">Livraison automatique</p>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    Dès qu&apos;un acheteur règle le produit, il accède immédiatement à ce fichier depuis son espace &laquo; Mes achats &raquo;. Il pourra aussi laisser un avis après téléchargement.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 4 — Pricing ── */}
            {step === 4 && (
              <div className="bg-white p-8 md:p-12 space-y-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">04 / Pricing</p>
                  <h2 className="text-2xl font-extrabold tracking-tighter text-zinc-900">Tarification.</h2>
                </div>

                {/* Toggle Gratuit / Payant */}
                <div className={`flex items-center justify-between gap-4 p-5 border-l-4 ${isFree ? "bg-emerald-50 border-emerald-500" : "bg-[#f3f3f4] border-zinc-300"}`}>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {isFree ? "Ce produit est gratuit" : "Ce produit est payant"}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {isFree
                        ? "Les apprenants y accèdent sans payer. Idéal pour acquérir une audience."
                        : "Les apprenants paient pour accéder. Vous touchez 95% du prix."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFree((v) => !v);
                      if (!isFree) setPrice(0);
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${isFree ? "bg-emerald-500" : "bg-zinc-300"}`}
                    aria-pressed={isFree}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isFree ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 ${isFree ? "opacity-40 pointer-events-none" : ""}`}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Prix de vente (FCFA)</label>
                      <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min="0" disabled={isFree}
                        className="w-full bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-4 px-6 text-2xl font-extrabold tabular-nums text-zinc-900 outline-none" />
                      <p className="text-xs text-zinc-500 tabular-nums">≈ {formatFCFA(euroEquiv)} €</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Prix barré (optionnel)</label>
                      <input type="number" value={originalPrice || ""} onChange={(e) => setOriginalPrice(Number(e.target.value))} placeholder="0" min="0" disabled={isFree}
                        className="w-full bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-4 px-6 text-lg font-bold tabular-nums text-zinc-900 placeholder:text-zinc-400 outline-none" />
                      {originalPrice > price && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] tabular-nums">
                          Réduction : -{Math.round((1 - price / originalPrice) * 100)}%
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-900 p-8 text-white flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#6bff8f] mb-4">Répartition</p>
                      <div className="space-y-5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Prix total</p>
                          <p className="text-3xl font-extrabold tabular-nums tracking-tighter">{formatFCFA(price)}</p>
                          <p className="text-[10px] text-zinc-500">FCFA</p>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Votre part (95%)</p>
                          <p className="text-2xl font-bold tabular-nums text-[#22c55e]">{formatFCFA(price * 0.95)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Commission Novakou (5%)</p>
                          <p className="text-lg font-bold tabular-nums text-zinc-300">{formatFCFA(price * 0.05)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 5 — Summary ── */}
            {step === 5 && (
              <div className="space-y-10">
                <div className="bg-white p-8 md:p-12 space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">05 / Summary</p>
                    <h2 className="text-2xl font-extrabold tracking-tighter text-zinc-900">Récapitulatif.</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Aperçu</label>
                      <div className="aspect-square bg-[#f3f3f4] relative overflow-hidden">
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-zinc-300">image</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 w-1 bg-[#22c55e] h-full" />
                      </div>
                    </div>

                    <dl className="space-y-6">
                      {[
                        { label: "Type", value: selected?.label ?? "—" },
                        { label: "Titre", value: title || "—" },
                        { label: "Catégorie", value: category || "—" },
                        ...(isFormation
                          ? [
                              { label: "Curriculum", value: `${modules.filter((m) => m.title.trim()).length} modules · ${totalLessons} leçons · ${totalDuration} min` },
                            ]
                          : [
                              { label: "Fichier", value: fileUrl ? "URL configurée" : "Non configuré" },
                            ]),
                        { label: "Prix", value: isFree ? "Gratuit" : `${formatFCFA(price)} FCFA · ≈ ${formatFCFA(euroEquiv)} €` },
                      ].map((row) => (
                        <div key={row.label} className="space-y-1 pb-4 border-b border-[#e8e8e8] last:border-0">
                          <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{row.label}</dt>
                          <dd className="text-sm font-bold text-zinc-900 break-words">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                {error && (
                  <div className="bg-[#ffdad6] p-5 flex items-start gap-3 border-l-4 border-[#ba1a1a]">
                    <span className="material-symbols-outlined text-[#ba1a1a]">error</span>
                    <p className="text-sm text-[#93000a]">{error}</p>
                  </div>
                )}

                <div className="p-6 bg-[#f3f3f4] border-l-4 border-[#22c55e]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-2">Avant publication</p>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    Votre produit sera <span className="font-bold">publié immédiatement</span> sur la marketplace. Vous pourrez le modifier ou le retirer à tout moment depuis votre tableau de bord.
                  </p>
                </div>
              </div>
            )}

            {/* Actions bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-8">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors py-4 px-2"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Étape précédente
              </button>

              <div className="flex gap-0">
                {step < lastStep ? (
                  <button
                    onClick={() => setStep((s) => Math.min(lastStep, s + 1))}
                    disabled={!canProceed}
                    className="px-10 py-4 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Étape suivante
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => createMutation.mutate(false)}
                      disabled={createMutation.isPending}
                      className="px-8 py-4 bg-[#e8e8e8] text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:bg-[#dadada] transition-colors disabled:opacity-50"
                    >
                      {createMutation.isPending ? "Enregistrement…" : "Enregistrer en brouillon"}
                    </button>
                    <button
                      onClick={() => createMutation.mutate(true)}
                      disabled={createMutation.isPending}
                      className="px-10 py-4 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors disabled:opacity-50"
                    >
                      {createMutation.isPending ? "Publication…" : "Publier maintenant"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// Suppress unused warning if needed
void slugify;
