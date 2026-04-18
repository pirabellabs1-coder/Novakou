import Link from "next/link";
import Image from "next/image";

interface Item {
  kind: "formation" | "product";
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  isFree: boolean;
  rating: number;
  count: number;
}

interface Owner {
  name: string;
  email: string | null;
  image: string | null;
  bio: string | null;
  kind: "vendor" | "mentor";
  domain: string | null;
  themeColor?: string | null;
}

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export default function BoutiqueView({
  owner,
  formations,
  products,
}: {
  owner: Owner;
  formations: Item[];
  products: Item[];
}) {
  const all = [...formations, ...products];
  const hasContent = all.length > 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
          <div className="flex items-center gap-5">
            {owner.image ? (
              <Image
                src={owner.image}
                alt={owner.name}
                width={72}
                height={72}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-[#006e2f]/10"
                unoptimized
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-extrabold text-2xl">
                {owner.name[0]?.toUpperCase() ?? "N"}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] tracking-tight">
                {owner.name}
              </h1>
              <p className="text-sm text-[#5c647a] mt-1">
                Boutique officielle ·{" "}
                <span className="font-semibold text-[#006e2f]">Propulsé par Novakou</span>
              </p>
            </div>
          </div>
          {owner.bio && (
            <p className="text-sm md:text-base text-[#5c647a] leading-relaxed mt-5 max-w-2xl">
              {owner.bio}
            </p>
          )}
        </div>
      </header>

      {/* Catalogue */}
      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {!hasContent ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-gray-300">storefront</span>
            <p className="text-lg font-bold text-[#191c1e] mt-4">Boutique en construction</p>
            <p className="text-sm text-[#5c647a] mt-1.5">Les premiers produits arrivent bientôt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {all.map((item) => {
              const href =
                item.kind === "formation" ? `/formation/${item.slug}` : `/produit/${item.slug}`;
              return (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={href}
                  className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-200">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-white/60">
                          {item.kind === "formation" ? "school" : "inventory_2"}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur px-2 py-1 rounded-full">
                      {item.kind === "formation" ? "Formation" : "Produit"}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-extrabold text-[#191c1e] leading-snug line-clamp-2 group-hover:text-[#006e2f] transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-extrabold text-[#006e2f]">
                        {item.isFree ? "Gratuit" : fmtFCFA(item.price)}
                      </span>
                      {item.rating > 0 && (
                        <span className="text-xs text-[#5c647a] inline-flex items-center gap-1">
                          <span
                            className="material-symbols-outlined text-[14px] text-amber-400"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          {item.rating.toFixed(1)} ({item.count})
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-12">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-[#5c647a]">
          <p>
            © {new Date().getFullYear()} {owner.name}
            {owner.domain ? ` · ${owner.domain}` : ""}
          </p>
          <a
            href="https://novakou.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#006e2f] hover:underline"
          >
            Créer ma boutique sur Novakou →
          </a>
        </div>
      </footer>
    </div>
  );
}
