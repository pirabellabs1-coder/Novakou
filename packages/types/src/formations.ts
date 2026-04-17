// Novakou — Types TypeScript formations platform
// Aligned with Prisma schema (single-language fields with `locale`)

// ── Enums ──

export type FormationLevel = "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE" | "TOUS_NIVEAUX";
export type LessonType = "VIDEO" | "PDF" | "TEXTE" | "AUDIO" | "QUIZ";
export type QuestionType = "CHOIX_UNIQUE" | "CHOIX_MULTIPLE" | "VRAI_FAUX" | "TEXTE_LIBRE";
export type FormationStatus = "BROUILLON" | "EN_ATTENTE" | "ACTIF" | "ARCHIVE";
export type InstructeurStatus = "EN_ATTENTE" | "APPROUVE" | "SUSPENDU";

// ── Base types ──

export interface FormationCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  _count?: { formations: number };
}

export interface InstructeurPublic {
  id: string;
  userId: string;
  bioFr: string | null;
  bioEn: string | null;
  expertise: string[];
  linkedin: string | null;
  website: string | null;
  youtube: string | null;
  status: InstructeurStatus;
  user: {
    id: string;
    name: string;
    image: string | null;
    avatar: string | null;
    country: string | null;
  };
  _count?: {
    formations: number;
  };
  avgRating?: number;
  totalStudents?: number;
}

export interface FormationCard {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  thumbnail: string | null;
  level: FormationLevel;
  language: string[];
  duration: number;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  hasCertificate: boolean;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  status: FormationStatus;
  publishedAt: Date | null;
  createdAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  };
  instructeur: {
    id: string;
    user: {
      name: string;
      avatar: string | null;
      image: string | null;
    };
  };
}

export interface FormationWithInstructor extends FormationCard {
  instructeur: InstructeurPublic;
}

export interface SectionWithLessons {
  id: string;
  title: string;
  desc: string | null;
  order: number;
  lessons: LessonPublic[];
}

export interface LessonPublic {
  id: string;
  title: string;
  type: LessonType;
  duration: number | null;
  order: number;
  isFree: boolean;
  quiz?: { id: string; passingScore: number } | null;
}

export interface LessonForPlayer extends LessonPublic {
  desc: string | null;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  audioUrl: string | null;
  allowDownload: boolean;
  resources: { id: string; name: string; url: string; mimeType: string | null }[];
}

export interface QuestionPublic {
  id: string;
  text: string;
  type: QuestionType;
  options: { text: string; value: string }[];
  order: number;
}

export interface QuizPublic {
  id: string;
  title: string;
  passingScore: number;
  timeLimit: number | null;
  questions: QuestionPublic[];
}

export interface QuizResult {
  quizId: string;
  lessonId: string;
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  corrections: {
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string | null;
  }[];
}

export interface FormationDetail {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  description: string | null;
  learnPoints: string[];
  requirements: string[];
  targetAudience: string | null;
  thumbnail: string | null;
  previewVideo: string | null;
  level: FormationLevel;
  language: string[];
  duration: number;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  hasCertificate: boolean;
  minScore: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  status: FormationStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  category: FormationCategory;
  instructeur: InstructeurPublic;
  sections: SectionWithLessons[];
  reviews: FormationReviewPublic[];
}

export interface FormationReviewPublic {
  id: string;
  rating: number;
  comment: string;
  response: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  user: {
    name: string;
    avatar: string | null;
    image: string | null;
    country: string | null;
  };
}

export interface EnrollmentWithProgress {
  id: string;
  userId: string;
  formationId: string;
  progress: number;
  completedAt: Date | null;
  paidAmount: number;
  createdAt: Date;
  formation: FormationCard;
  lessonProgress: {
    lessonId: string;
    completed: boolean;
    score: number | null;
    watchedPct: number | null;
    completedAt: Date | null;
  }[];
  certificate: CertificatePublic | null;
}

export interface CertificatePublic {
  id: string;
  code: string;
  score: number;
  pdfUrl: string | null;
  issuedAt: Date;
  revokedAt: Date | null;
  formation: {
    title: string;
    duration: number;
    instructeur: {
      user: { name: string };
    };
  };
  user: {
    name: string;
    country: string | null;
  };
}

// ── Filters & Sort ──

export interface FormationsFilters {
  q?: string;
  categorySlug?: string;
  level?: FormationLevel | "all";
  priceRange?: "all" | "free" | "paid" | "under20" | "20to50" | "over50";
  duration?: "all" | "under2h" | "2h5h" | "5h10h" | "over10h";
  minRating?: number;
  language?: "fr" | "en" | "all";
  page?: number;
  limit?: number;
}

export type FormationsSort =
  | "pertinence"
  | "populaire"
  | "note"
  | "nouveau"
  | "prix_asc"
  | "prix_desc";

export interface FormationsListResult {
  formations: FormationCard[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Instructor types ──

export interface InstructorStats {
  totalRevenue: number;
  revenueThisMonth: number;
  pendingRevenue: number;
  netRevenue: number; // 70%
  totalStudents: number;
  activeFormations: number;
  avgRating: number;
  revenueByMonth: { month: string; amount: number }[];
  studentsByMonth: { month: string; count: number }[];
  topFormations: {
    id: string;
    title: string;
    students: number;
    revenue: number;
    rating: number;
  }[];
}

export interface InstructorTransaction {
  id: string;
  formationTitle: string;
  studentName: string;
  amount: number; // brut
  net: number;    // 70%
  commission: number; // 30%
  status: "DISPONIBLE" | "EN_ATTENTE" | "RETIRE";
  createdAt: Date;
}

// ── Cohort types ──

export type CohortStatus = "OUVERT" | "COMPLET" | "EN_COURS" | "TERMINE" | "ANNULE";

export interface FormationCohortCard {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  enrollmentDeadline: string;
  durationDays: number;
  maxParticipants: number;
  currentCount: number;
  price: number;
  originalPrice: number | null;
  status: CohortStatus;
  schedule: unknown;
  createdAt: string;
  formation: {
    id: string;
    slug: string;
    title: string;
    thumbnail: string | null;
    duration: number;
    level: FormationLevel;
    category: {
      name: string;
      slug: string;
    };
    instructeur: {
      id: string;
      user: {
        name: string;
        avatar: string | null;
        image: string | null;
      };
    };
  };
}

export interface CohortDetail extends FormationCohortCard {
  updatedAt: string;
  _count?: {
    enrollments: number;
    messages: number;
  };
}

export interface CohortMessagePublic {
  id: string;
  content: string;
  isInstructor: boolean;
  isPinned: boolean;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    image: string | null;
  };
}

export interface CohortParticipant {
  id: string;
  progress: number;
  completedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    image: string | null;
    country: string | null;
  };
  certificate: { code: string } | null;
}

// ── Cart types ──

export interface CartItemWithFormation {
  id: string;
  formationId: string;
  formation: FormationCard;
}

export interface CartSummary {
  items: CartItemWithFormation[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
  promoDiscountPct?: number;
}
