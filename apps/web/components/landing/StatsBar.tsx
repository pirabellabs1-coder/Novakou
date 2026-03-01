import { Users, CheckCircle2, Globe } from "lucide-react";

const STATS = [
  {
    icon: Users,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    label: "Freelances actifs",
    value: "15 000+",
    growth: "+12% ce mois",
    growthColor: "text-primary",
    showArrow: true,
  },
  {
    icon: CheckCircle2,
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    label: "Missions complétées",
    value: "8 240",
    growth: "+8% croissance",
    growthColor: "text-secondary",
    showArrow: true,
  },
  {
    icon: Globe,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    label: "Pays couverts",
    value: "24",
    growth: "Afrique & Diaspora",
    growthColor: "text-gray-500",
    showArrow: false,
  },
];

export function StatsBar() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white p-6 sm:p-8 rounded-xl border border-gray-100 shadow-xl flex items-center gap-5"
            >
              <div
                className={`size-14 rounded-full ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`h-7 w-7 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-extrabold text-gray-900 leading-tight">
                  {stat.value}
                </h3>
                <span
                  className={`text-xs font-bold ${stat.growthColor} flex items-center gap-1 mt-0.5`}
                >
                  {stat.showArrow && "↑ "}
                  {stat.growth}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
