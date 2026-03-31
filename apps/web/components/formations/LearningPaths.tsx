"use client";

import Link from "next/link";
import { Code, Palette, TrendingUp, BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LearningPaths() {
  const t = useTranslations("formations");

  const paths = [
    { icon: Code, title: t("path_fullstack"), desc: t("path_fullstack_desc"), color: "from-blue-500 to-cyan-500", category: "developpement-web" },
    { icon: Palette, title: t("path_design"), desc: t("path_design_desc"), color: "from-pink-500 to-rose-500", category: "design-creativite" },
    { icon: TrendingUp, title: t("path_marketing"), desc: t("path_marketing_desc"), color: "from-orange-500 to-amber-500", category: "marketing-digital" },
    { icon: BarChart3, title: t("path_data"), desc: t("path_data_desc"), color: "from-indigo-500 to-violet-500", category: "data-science-analytics" },
  ];

  return (
    <section className="py-16 px-6 bg-slate-50 dark:bg-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center mb-2">{t("learning_paths_title")}</h2>
        <p className="text-slate-500 text-center mb-10 text-sm">{t("learning_paths_subtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paths.map((path) => (
            <Link
              key={path.category}
              href={`/formations/explorer?category=${path.category}`}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden"
            >
              {/* Gradient accent top */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${path.color}`} />

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${path.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <path.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{path.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{path.desc}</p>

              <span className="text-xs font-semibold text-primary">
                {t("path_explore")} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
