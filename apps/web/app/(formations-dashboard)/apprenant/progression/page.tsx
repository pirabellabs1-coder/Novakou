import Link from "next/link";
import { productImageSrc } from "@/lib/utils/image-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { TrendingUp, PlayCircle, GraduationCap, Trophy, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  title: string;
  thumbnail: string | null;
  progress: number;
  totalLessons: number;
  completed: boolean;
}

async function getProgress(userId: string): Promise<Row[]> {
  const enrollments = await prisma.enrollment
    .findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        formation: {
          select: {
            title: true,
            thumbnail: true,
            sections: { select: { _count: { select: { lessons: true } } } },
          },
        },
      },
    })
    .catch(() => []);

  return enrollments.map((e) => ({
    id: e.id,
    title: e.formation?.title ?? "Formation",
    thumbnail: e.formation?.thumbnail ?? null,
    progress: Math.round(e.progress ?? 0),
    totalLessons: e.formation?.sections.reduce((s, sec) => s + sec._count.lessons, 0) ?? 0,
    completed: !!e.completedAt || (e.progress ?? 0) >= 100,
  }));
}

export default async function ProgressionPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const rows = userId ? await getProgress(userId) : [];

  const avg = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.progress, 0) / rows.length)
    : 0;
  const done = rows.filter((r) => r.completed).length;
  const inProgress = rows.filter((r) => !r.completed && r.progress > 0).length;

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={22} className="text-[#006e2f]" />
        <h1 className="text-xl md:text-2xl font-extrabold text-[#13241b]">Ma progression</h1>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-7">
        {[
          { icon: GraduationCap, label: "Formations", value: rows.length, color: "#006e2f" },
          { icon: PlayCircle, label: "En cours", value: inProgress, color: "#0ea5e9" },
          { icon: Trophy, label: "Terminées", value: done, color: "#f59e0b" },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-4 md:p-5">
              <Icon size={20} style={{ color: k.color }} />
              <p className="text-2xl font-extrabold text-[#13241b] mt-2">{k.value}</p>
              <p className="text-xs text-[#5d7166] font-medium">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Progression moyenne */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-5 md:p-6 mb-7">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#13241b]">Progression moyenne</span>
            <span className="text-sm font-extrabold text-[#006e2f]">{avg}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#eef2ef] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#006e2f] to-[#22c55e] transition-all"
              style={{ width: `${avg}%` }}
            />
          </div>
        </div>
      )}

      {/* Liste */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-10 text-center">
          <BookOpen size={40} className="mx-auto text-[#8aa092] mb-3" />
          <h2 className="text-lg font-extrabold text-[#13241b]">Aucune formation pour l'instant</h2>
          <p className="text-sm text-[#5d7166] mt-1 mb-5">
            Inscris-toi à une formation pour suivre ta progression ici.
          </p>
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006e2f] to-[#22c55e] text-white text-sm font-bold px-5 py-2.5 hover:opacity-90 transition-opacity"
          >
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Link
              key={r.id}
              href={`/apprenant/formation/${r.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-[#e4eae6] shadow-sm p-4 hover:border-[#006e2f]/30 hover:shadow-md transition-all group"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center">
                {r.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={productImageSrc(r.thumbnail, 160) ?? r.thumbnail} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <PlayCircle size={24} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#13241b] truncate group-hover:text-[#006e2f] transition-colors">
                  {r.title}
                </h3>
                <p className="text-xs text-[#5d7166] mt-0.5">
                  {r.totalLessons > 0 ? `${r.totalLessons} leçons` : "Formation"}
                  {r.completed && " · Terminée ✓"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[#eef2ef] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#006e2f] to-[#22c55e]"
                      style={{ width: `${r.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-[#006e2f] w-10 text-right">{r.progress}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
