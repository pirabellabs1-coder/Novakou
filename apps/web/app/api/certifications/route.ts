import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import fs from "fs";
import path from "path";

const IS_DEV = process.env.DEV_MODE === "true";

// ── Persistence ──
const DEV_DIR = path.join(process.cwd(), "lib", "dev");
const RESULTS_FILE = path.join(DEV_DIR, "certification-results.json");

function ensureDir() {
  if (!fs.existsSync(DEV_DIR)) fs.mkdirSync(DEV_DIR, { recursive: true });
}

interface StoredResult {
  id: string;
  userId: string;
  certificationId: string;
  score: number;
  passed: boolean;
  date: string;
  answers: number[];
}

function readResults(): StoredResult[] {
  try {
    if (!fs.existsSync(RESULTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeResults(data: StoredResult[]) {
  ensureDir();
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── 40 certifications catalog (inline — small, no external import needed) ──
const CERTIFICATIONS = [
  { id: "cert-dev-web", name: "Developpement Web", category: "Technique", icon: "code", description: "HTML, CSS, JavaScript et frameworks modernes.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-dev-mobile", name: "Developpement Mobile", category: "Technique", icon: "phone_android", description: "React Native, Flutter et apps mobiles.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-dev-backend", name: "Developpement Backend", category: "Technique", icon: "dns", description: "Node.js, APIs et bases de donnees.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-dev-python", name: "Python & Data Science", category: "Technique", icon: "data_object", description: "Python, pandas, numpy et machine learning.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-dev-wordpress", name: "WordPress & CMS", category: "Technique", icon: "web", description: "WordPress, themes, plugins et CMS.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-cybersecurite", name: "Cybersecurite", category: "Technique", icon: "security", description: "Securite informatique et protection des systemes.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-devops", name: "DevOps & Cloud", category: "Technique", icon: "cloud", description: "CI/CD, Docker, Kubernetes et cloud.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-ia-ml", name: "Intelligence Artificielle & ML", category: "Technique", icon: "smart_toy", description: "IA, machine learning et deep learning.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-blockchain", name: "Blockchain & Web3", category: "Technique", icon: "currency_bitcoin", description: "Blockchain, smart contracts et DApps.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-qa-testing", name: "Tests & Assurance Qualite", category: "Technique", icon: "bug_report", description: "Tests unitaires, integration et QA.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-design-ui", name: "Design UI/UX", category: "Design", icon: "palette", description: "Principes de design d'interface et UX.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-design-graphique", name: "Design Graphique", category: "Design", icon: "brush", description: "Graphisme, composition et outils de design.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-design-3d", name: "Design 3D & Animation", category: "Design", icon: "view_in_ar", description: "Modelisation 3D, animation et rendu.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-design-video", name: "Montage Video & Motion", category: "Design", icon: "movie", description: "Montage video, motion design et effets.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-design-photo", name: "Photographie & Retouche", category: "Design", icon: "photo_camera", description: "Photographie, retouche et post-production.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-design-branding", name: "Branding & Identite Visuelle", category: "Design", icon: "branding_watermark", description: "Identite visuelle, logos et charte graphique.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-marketing-digital", name: "Marketing Digital", category: "Marketing", icon: "campaign", description: "Strategies marketing et canaux digitaux.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-seo", name: "SEO & Referencement", category: "Marketing", icon: "travel_explore", description: "Optimisation pour les moteurs de recherche.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-social-media", name: "Social Media Management", category: "Marketing", icon: "share", description: "Gestion des reseaux sociaux et engagement.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-email-marketing", name: "Email Marketing & Automation", category: "Marketing", icon: "email", description: "Campagnes email, automation et newsletters.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-publicite", name: "Publicite en Ligne", category: "Marketing", icon: "ads_click", description: "Google Ads, Facebook Ads et campagnes payantes.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-analytics", name: "Analytics & Data Marketing", category: "Marketing", icon: "analytics", description: "Google Analytics, KPIs et dashboards.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-redaction", name: "Redaction Web & Copywriting", category: "Redaction", icon: "edit_note", description: "Redaction web, SEO writing et storytelling.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-traduction", name: "Traduction & Localisation", category: "Redaction", icon: "translate", description: "Traduction, localisation et adaptation culturelle.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-content-strategy", name: "Strategie de Contenu", category: "Redaction", icon: "article", description: "Strategie editoriale et content marketing.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-journalisme", name: "Journalisme Digital", category: "Redaction", icon: "newspaper", description: "Journalisme web, fact-checking et ethique.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-gestion-projet", name: "Gestion de Projet", category: "Management", icon: "assignment", description: "Planification, suivi et livraison de projets.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-product-management", name: "Product Management", category: "Management", icon: "inventory_2", description: "Decouverte produit, roadmap et priorisation.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-agile", name: "Methodologies Agiles", category: "Management", icon: "sprint", description: "Scrum, Kanban, SAFe et ceremonies agiles.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-leadership", name: "Leadership & Management", category: "Management", icon: "groups", description: "Leadership, delegation et gestion d'equipe.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-entrepreneuriat", name: "Entrepreneuriat & Startup", category: "Management", icon: "rocket_launch", description: "Business model, lean startup et financement.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-service-client", name: "Service Client & Support", category: "Communication", icon: "support_agent", description: "Support client, NPS et resolution de problemes.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-community", name: "Community Management", category: "Communication", icon: "forum", description: "Gestion de communaute et engagement.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-relation-publique", name: "Relations Publiques", category: "Communication", icon: "record_voice_over", description: "Relations presse, communication de crise.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-presentation", name: "Art de la Presentation", category: "Communication", icon: "slideshow", description: "Storytelling, slides et prise de parole.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-comptabilite", name: "Comptabilite & Finance", category: "Finance", icon: "account_balance", description: "Bilan, compte de resultat et tresorerie.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-ecommerce", name: "E-commerce & Vente en Ligne", category: "Finance", icon: "shopping_cart", description: "Conversion, checkout et logistique.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-crypto-finance", name: "Finance Decentralisee (DeFi)", category: "Finance", icon: "currency_exchange", description: "Protocoles DeFi, wallets et smart contracts.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-rgpd", name: "RGPD & Protection des Donnees", category: "Juridique", icon: "gavel", description: "Consentement, DPO, droits et sanctions RGPD.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
  { id: "cert-droit-numerique", name: "Droit du Numerique & Contrats", category: "Juridique", icon: "policy", description: "CGV, propriete intellectuelle et e-signature.", questionCount: 20, passingScore: 70, durationMinutes: 25 },
];

// ── Questions loaded lazily from JSON at runtime (avoids Turbopack issues with huge TS files) ──
let _questionsCache: Record<string, { id: string; question: string; options: string[]; correctIndex: number }[]> | null = null;

async function getQuestions(): Promise<Record<string, { id: string; question: string; options: string[]; correctIndex: number }[]>> {
  if (_questionsCache) return _questionsCache;

  // Load questions from the data files at runtime
  const dataDir = path.join(process.cwd(), "lib");

  try {
    // Read and parse part 1 (certifications-data.ts exports QUESTIONS)
    const part1Path = path.join(dataDir, "certifications-questions.json");
    const part2Path = path.join(dataDir, "certifications-questions-part2.json");

    // If JSON cache files exist, use them
    if (fs.existsSync(part1Path) && fs.existsSync(part2Path)) {
      const q1 = JSON.parse(fs.readFileSync(part1Path, "utf-8"));
      const q2 = JSON.parse(fs.readFileSync(part2Path, "utf-8"));
      _questionsCache = { ...q1, ...q2 };
      return _questionsCache!;
    }

    // Fallback: dynamic import
    const certData = await import("@/lib/certifications-data");
    const part2Data = await import("@/lib/certifications-questions-part2");
    _questionsCache = { ...certData.QUESTIONS, ...part2Data.QUESTIONS_PART2 };
    return _questionsCache!;
  } catch (err) {
    console.error("[Certifications] Failed to load questions:", err);
    _questionsCache = {};
    return _questionsCache;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (IS_DEV ? "dev-user" : null);
  if (!userId) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const results = readResults().filter((r) => r.userId === userId);
  const allQ = await getQuestions();

  return NextResponse.json({
    certifications: CERTIFICATIONS,
    results: results.map((r) => {
      const cert = CERTIFICATIONS.find((c) => c.id === r.certificationId);
      const questions = allQ[r.certificationId] || [];
      let correctCount = 0;
      const questionResults = questions.map((q, i) => {
        const isCorrect = r.answers[i] === q.correctIndex;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          question: q.question,
          options: q.options,
          userAnswer: r.answers[i],
          correctAnswer: q.correctIndex,
          isCorrect,
        };
      });
      return {
        id: r.id,
        certificationId: r.certificationId,
        certificationName: cert?.name || "",
        certificationCategory: cert?.category || "",
        score: r.score,
        passed: r.passed,
        date: r.date,
        answers: r.answers,
        totalQuestions: questions.length,
        correctCount,
        questionResults,
        certificateId: r.passed ? `CERT-${r.certificationId.toUpperCase().replace("CERT-", "")}-${r.id.replace("cr", "").toUpperCase()}` : null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (IS_DEV ? "dev-user" : null);
  if (!userId) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "submit") {
    const certId = body.certificationId;
    const answers: number[] = body.answers || [];
    const cert = CERTIFICATIONS.find((c) => c.id === certId);
    if (!cert) return NextResponse.json({ error: "Certification introuvable" }, { status: 404 });

    const allQ = await getQuestions();
    const questions = allQ[certId] || [];
    if (questions.length === 0) {
      return NextResponse.json({ error: "Questions non disponibles pour cette certification" }, { status: 404 });
    }
    if (answers.length !== questions.length) {
      return NextResponse.json({ error: "Nombre de reponses incorrect" }, { status: 400 });
    }

    let correct = 0;
    const questionResults = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctIndex;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        userAnswer: answers[i],
        correctAnswer: q.correctIndex,
        isCorrect,
      };
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= cert.passingScore;

    const result: StoredResult = {
      id: "cr" + Date.now(),
      userId,
      certificationId: certId,
      score,
      passed,
      date: new Date().toISOString(),
      answers,
    };

    const allResults = readResults();
    allResults.push(result);
    writeResults(allResults);

    const certificateId = passed ? `CERT-${certId.toUpperCase().replace("CERT-", "")}-${Date.now().toString(36).toUpperCase()}` : null;

    return NextResponse.json({
      result: {
        id: result.id,
        certificationId: result.certificationId,
        certificationName: cert.name,
        certificationCategory: cert.category,
        score: result.score,
        passed: result.passed,
        date: result.date,
        answers: result.answers,
        totalQuestions: questions.length,
        correctCount: correct,
        questionResults,
        certificateId,
      },
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
