import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import fs from "fs";
import path from "path";

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

// ── Certification catalog ──
const CERTIFICATIONS = [
  {
    id: "cert-dev-web",
    name: "Developpement Web",
    category: "Technique",
    icon: "code",
    description: "Validez vos competences en HTML, CSS, JavaScript et frameworks modernes.",
    questionCount: 5,
    passingScore: 70,
    durationMinutes: 10,
  },
  {
    id: "cert-design-ui",
    name: "Design UI/UX",
    category: "Design",
    icon: "palette",
    description: "Demontrez votre maitrise des principes de design d'interface et d'experience utilisateur.",
    questionCount: 5,
    passingScore: 70,
    durationMinutes: 10,
  },
  {
    id: "cert-marketing",
    name: "Marketing Digital",
    category: "Marketing",
    icon: "campaign",
    description: "Prouvez vos connaissances en SEO, publicite en ligne et strategie de contenu.",
    questionCount: 5,
    passingScore: 70,
    durationMinutes: 10,
  },
  {
    id: "cert-redaction",
    name: "Redaction & Copywriting",
    category: "Redaction",
    icon: "edit_note",
    description: "Validez vos competences en redaction web, storytelling et copywriting persuasif.",
    questionCount: 5,
    passingScore: 70,
    durationMinutes: 10,
  },
  {
    id: "cert-gestion-projet",
    name: "Gestion de Projet",
    category: "Management",
    icon: "assignment",
    description: "Demontrez votre capacite a planifier, executer et livrer des projets avec succes.",
    questionCount: 5,
    passingScore: 70,
    durationMinutes: 10,
  },
  {
    id: "cert-service-client",
    name: "Service Client",
    category: "Communication",
    icon: "support_agent",
    description: "Prouvez votre excellence en communication client et resolution de problemes.",
    questionCount: 5,
    passingScore: 70,
    durationMinutes: 10,
  },
];

// ── Questions per certification (correct answer = correctIndex) ──
const QUESTIONS: Record<string, { id: string; question: string; options: string[]; correctIndex: number }[]> = {
  "cert-dev-web": [
    { id: "q1", question: "Quel attribut HTML5 permet de rendre un champ de formulaire obligatoire ?", options: ["mandatory", "required", "validate", "needed"], correctIndex: 1 },
    { id: "q2", question: "Quelle propriete CSS est utilisee pour creer une grille responsive ?", options: ["display: grid", "display: flex", "position: grid", "layout: responsive"], correctIndex: 0 },
    { id: "q3", question: "Que retourne typeof null en JavaScript ?", options: ["null", "undefined", "object", "boolean"], correctIndex: 2 },
    { id: "q4", question: "Quel hook React est utilise pour gerer les effets de bord ?", options: ["useState", "useEffect", "useContext", "useMemo"], correctIndex: 1 },
    { id: "q5", question: "Quelle methode HTTP est idempotente par convention ?", options: ["POST", "PATCH", "PUT", "DELETE + POST"], correctIndex: 2 },
  ],
  "cert-design-ui": [
    { id: "q1", question: "Quel principe stipule que les elements proches sont percus comme lies ?", options: ["Contraste", "Proximite", "Alignement", "Repetition"], correctIndex: 1 },
    { id: "q2", question: "Quelle est la taille minimale recommandee pour une zone tactile mobile ?", options: ["24px", "36px", "44px", "64px"], correctIndex: 2 },
    { id: "q3", question: "Quel rapport de contraste minimum est requis par WCAG AA pour le texte normal ?", options: ["3:1", "4.5:1", "7:1", "2:1"], correctIndex: 1 },
    { id: "q4", question: "Que mesure un test A/B en UX ?", options: ["La vitesse de chargement", "La performance entre deux variantes", "Le nombre de couleurs", "La taille de la police"], correctIndex: 1 },
    { id: "q5", question: "Quel outil est le plus adapte pour creer des prototypes interactifs ?", options: ["Photoshop", "Figma", "Excel", "Notepad"], correctIndex: 1 },
  ],
  "cert-marketing": [
    { id: "q1", question: "Que signifie SEO ?", options: ["Search Engine Optimization", "Social Engine Output", "Site Enhancement Option", "Search External Outreach"], correctIndex: 0 },
    { id: "q2", question: "Quel KPI mesure le cout d'acquisition d'un client ?", options: ["CLV", "CAC", "CTR", "CPC"], correctIndex: 1 },
    { id: "q3", question: "Quelle plateforme est la plus adaptee au marketing B2B ?", options: ["TikTok", "LinkedIn", "Snapchat", "Pinterest"], correctIndex: 1 },
    { id: "q4", question: "Qu'est-ce qu'un tunnel de conversion ?", options: ["Un outil de SEO", "Le parcours utilisateur vers l'achat", "Un type de publicite", "Un format d'email"], correctIndex: 1 },
    { id: "q5", question: "Quel est le taux d'ouverture moyen des emails marketing ?", options: ["5-10%", "15-25%", "40-50%", "60-70%"], correctIndex: 1 },
  ],
  "cert-redaction": [
    { id: "q1", question: "Quelle technique de redaction consiste a commencer par la conclusion ?", options: ["Storytelling", "Pyramide inversee", "Accroche emotionnelle", "Call to action"], correctIndex: 1 },
    { id: "q2", question: "Quel element est essentiel dans un titre accrocheur ?", options: ["Longueur", "Benefice clair pour le lecteur", "Mots techniques", "Ponctuation multiple"], correctIndex: 1 },
    { id: "q3", question: "Quelle longueur ideale pour un paragraphe web ?", options: ["1-2 phrases", "3-4 phrases", "5-8 phrases", "10+ phrases"], correctIndex: 1 },
    { id: "q4", question: "Qu'est-ce que le tone of voice en copywriting ?", options: ["Le volume sonore", "La personnalite de la marque a l'ecrit", "La vitesse de lecture", "Le format du texte"], correctIndex: 1 },
    { id: "q5", question: "Quel framework de copywriting utilise : Attention, Interet, Desir, Action ?", options: ["PAS", "AIDA", "FAB", "STAR"], correctIndex: 1 },
  ],
  "cert-gestion-projet": [
    { id: "q1", question: "Quelle methodologie utilise des sprints de 2-4 semaines ?", options: ["Waterfall", "Scrum", "Kanban", "Prince2"], correctIndex: 1 },
    { id: "q2", question: "Que represente un diagramme de Gantt ?", options: ["Le budget", "La planification temporelle des taches", "Les risques", "Les parties prenantes"], correctIndex: 1 },
    { id: "q3", question: "Qu'est-ce qu'un MVP (Minimum Viable Product) ?", options: ["Le produit final", "La version minimale fonctionnelle", "Un prototype visuel", "Un plan marketing"], correctIndex: 1 },
    { id: "q4", question: "Quel outil mesure la satisfaction de l'equipe en Agile ?", options: ["Burndown chart", "Retrospective", "Daily standup", "Sprint review"], correctIndex: 1 },
    { id: "q5", question: "Que signifie le triangle de fer en gestion de projet ?", options: ["Cout, Qualite, Delai", "Equipe, Client, Produit", "Plan, Execute, Controle", "Risque, Budget, Scope"], correctIndex: 0 },
  ],
  "cert-service-client": [
    { id: "q1", question: "Quelle est la premiere etape pour gerer un client mecontent ?", options: ["Offrir un remboursement", "Ecouter activement", "Transferer a un superieur", "Envoyer un email type"], correctIndex: 1 },
    { id: "q2", question: "Que mesure le NPS (Net Promoter Score) ?", options: ["Le chiffre d'affaires", "La probabilite de recommandation", "Le nombre de tickets", "Le temps de reponse"], correctIndex: 1 },
    { id: "q3", question: "Quel delai de reponse est considere comme excellent en support ?", options: ["24h", "1h", "Moins de 15 min", "1 semaine"], correctIndex: 2 },
    { id: "q4", question: "Quelle technique consiste a reformuler les propos du client ?", options: ["Empathie active", "Mirroring", "Upselling", "Escalade"], correctIndex: 1 },
    { id: "q5", question: "Quel canal de support a le taux de satisfaction le plus eleve ?", options: ["Email", "Telephone", "Chat en direct", "FAQ"], correctIndex: 2 },
  ],
};

export { CERTIFICATIONS, QUESTIONS };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const results = readResults().filter((r) => r.userId === session.user.id);

  return NextResponse.json({
    certifications: CERTIFICATIONS,
    results: results.map((r) => ({
      id: r.id,
      certificationId: r.certificationId,
      score: r.score,
      passed: r.passed,
      date: r.date,
      answers: r.answers,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "submit") {
    const certId = body.certificationId;
    const answers: number[] = body.answers || [];
    const cert = CERTIFICATIONS.find((c) => c.id === certId);
    if (!cert) return NextResponse.json({ error: "Certification introuvable" }, { status: 404 });

    const questions = QUESTIONS[certId] || [];
    if (answers.length !== questions.length) {
      return NextResponse.json({ error: "Nombre de reponses incorrect" }, { status: 400 });
    }

    // Score
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIndex) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= cert.passingScore;

    const result: StoredResult = {
      id: "cr" + Date.now(),
      userId: session.user.id,
      certificationId: certId,
      score,
      passed,
      date: new Date().toISOString(),
      answers,
    };

    const allResults = readResults();
    allResults.push(result);
    writeResults(allResults);

    return NextResponse.json({
      result: {
        id: result.id,
        certificationId: result.certificationId,
        score: result.score,
        passed: result.passed,
        date: result.date,
        answers: result.answers,
      },
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
