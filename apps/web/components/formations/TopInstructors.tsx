"use client";

import { useState, useEffect } from "react";
import { Users, BookOpen, Star } from "lucide-react";
import { useTranslations } from "next-intl";

interface Instructor {
  id: string;
  bioFr: string | null;
  expertise: string[];
  user: { name: string; avatar: string | null };
  _count?: { formations: number };
  totalStudents?: number;
  avgRating?: number;
}

export default function TopInstructors() {
  const t = useTranslations("formations");
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  useEffect(() => {
    fetch("/api/formations/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data?.topInstructors) setInstructors(data.topInstructors);
      })
      .catch(() => {});
  }, []);

  if (instructors.length === 0) return null;

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center mb-2">{t("top_instructors_title")}</h2>
        <p className="text-slate-500 text-center mb-10 text-sm">{t("top_instructors_subtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {instructors.slice(0, 4).map((inst) => (
            <div key={inst.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden bg-primary/10">
                {inst.user.avatar ? (
                  <img src={inst.user.avatar} alt={inst.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary flex items-center justify-center h-full">
                    {inst.user.name.charAt(0)}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{inst.user.name}</h3>

              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {inst.expertise.slice(0, 3).map((skill) => (
                  <span key={skill} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{skill}</span>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {inst.totalStudents?.toLocaleString() ?? "0"} {t("instructor_students")}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {inst._count?.formations ?? 0} {t("instructor_courses")}
                </span>
              </div>

              {inst.avgRating && inst.avgRating > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{inst.avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
