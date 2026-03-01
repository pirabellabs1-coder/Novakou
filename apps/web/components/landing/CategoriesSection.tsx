import Link from "next/link";
import {
  Palette,
  Code2,
  TrendingUp,
  PenLine,
  Video,
  Music,
  Briefcase,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    icon: Palette,
    title: "Design & Créa",
    description: "UI/UX, Logo, Branding",
    slug: "design-crea",
  },
  {
    icon: Code2,
    title: "Développement",
    description: "Web, Mobile, Software",
    slug: "developpement",
  },
  {
    icon: TrendingUp,
    title: "Marketing",
    description: "SEO, Social Media, Ads",
    slug: "marketing",
  },
  {
    icon: PenLine,
    title: "Rédaction",
    description: "Articles, Traduction, Blog",
    slug: "redaction",
  },
  {
    icon: Video,
    title: "Vidéo & Photo",
    description: "Montage, Motion Design",
    slug: "video-photo",
  },
  {
    icon: Music,
    title: "Audio & Musique",
    description: "Jingles, Podcast, Voix-off",
    slug: "audio-musique",
  },
  {
    icon: Briefcase,
    title: "Business",
    description: "Conseil, Finance, Juridique",
    slug: "business",
  },
  {
    icon: BarChart3,
    title: "Data & IA",
    description: "Analyse, Machine Learning",
    slug: "data-ia",
  },
];

interface CategoryCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  slug: string;
}

function CategoryCard({ icon: Icon, title, description, slug }: CategoryCardProps) {
  return (
    <Link
      href={`/explorer?categorie=${slug}`}
      className={cn(
        "group bg-white hover:bg-primary border border-gray-200 hover:border-primary",
        "p-6 sm:p-8 rounded-xl transition-all duration-200 cursor-pointer",
        "hover:shadow-xl hover:shadow-primary/20"
      )}
    >
      <Icon className="h-10 w-10 text-primary group-hover:text-white mb-5 transition-transform group-hover:scale-110 duration-200" />
      <h4 className="text-base font-bold text-gray-900 group-hover:text-white mb-1">
        {title}
      </h4>
      <p className="text-sm text-gray-500 group-hover:text-white/80">
        {description}
      </p>
    </Link>
  );
}

export function CategoriesSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              Catégories Populaires
            </h2>
            <p className="text-gray-500 max-w-md">
              Trouvez l&apos;expert idéal parmi nos domaines d&apos;expertise
              les plus demandés.
            </p>
          </div>
          <Link
            href="/explorer"
            className="hidden sm:flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all text-sm"
          >
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>

        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 text-primary font-bold text-sm"
          >
            Voir toutes les catégories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
