"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ShieldCheck } from "lucide-react";
import { useCurrencyStore } from "@/store/currency";

interface FreelanceData {
  username: string;
  name: string;
  title: string;
  rating: number;
  reviewCount: number;
  skills: string[];
  dailyRateEur: number;
  avatar: string;
  verified: boolean;
}

const TOP_FREELANCES: FreelanceData[] = [
  {
    username: "fatou-ndiaye",
    name: "Fatou Ndiaye",
    title: "Senior UI/UX Designer",
    rating: 4.9,
    reviewCount: 127,
    skills: ["Figma", "Branding", "Webflow"],
    dailyRateEur: 450,
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80",
    verified: true,
  },
  {
    username: "moussa-diop",
    name: "Moussa Diop",
    title: "Fullstack Developer (MERN)",
    rating: 5.0,
    reviewCount: 89,
    skills: ["React", "Node.js", "AWS"],
    dailyRateEur: 600,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    verified: true,
  },
  {
    username: "awa-traore",
    name: "Awa Traoré",
    title: "Marketing Strategist",
    rating: 4.8,
    reviewCount: 203,
    skills: ["Growth", "Ads", "Content"],
    dailyRateEur: 400,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    verified: true,
  },
];

interface FreelanceCardProps {
  freelance: FreelanceData;
}

function FreelanceCard({ freelance }: FreelanceCardProps) {
  const { format } = useCurrencyStore();

  return (
    <Link
      href={`/freelances/${freelance.username}`}
      className="group bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 block"
    >
      {/* Cover photo */}
      <div className="relative h-48">
        <Image
          src={freelance.avatar}
          alt={`Photo de profil de ${freelance.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {freelance.verified && (
          <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Vérifié
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-lg font-bold text-gray-900">{freelance.name}</h4>
            <p className="text-sm text-primary font-medium">{freelance.title}</p>
          </div>
          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold">{freelance.rating}</span>
            <span className="text-xs text-gray-400">({freelance.reviewCount})</span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {freelance.skills.map((skill) => (
            <span
              key={skill}
              className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Rate */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-gray-400 text-sm">À partir de</span>
          <span className="text-lg font-extrabold text-primary">
            {format(freelance.dailyRateEur)} / jour
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TopFreelancesSection() {
  return (
    <section className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Top Freelances de la semaine
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Découvrez les profils les plus plébiscités pour leur qualité de
            travail et leur professionnalisme.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TOP_FREELANCES.map((freelance) => (
            <FreelanceCard key={freelance.username} freelance={freelance} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 bg-white border border-primary text-primary hover:bg-primary hover:text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-sm"
          >
            Voir tous les freelances
          </Link>
        </div>
      </div>
    </section>
  );
}
