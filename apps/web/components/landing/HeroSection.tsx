"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explorer?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/explorer");
    }
  }

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 min-h-[560px] sm:min-h-[600px] flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12">
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center opacity-30"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/85 to-gray-900/30" />
          </div>

          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 size-96 bg-primary/20 blur-[120px] rounded-full z-0" />
          <div className="absolute bottom-0 left-1/3 size-64 bg-secondary/15 blur-[100px] rounded-full z-0" />

          {/* Content */}
          <div className="relative z-10 max-w-2xl space-y-6">
            {/* Badge */}
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider">
              Réseau Francophone Elite
            </span>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              La plateforme freelance qui élève votre carrière{" "}
              <span className="text-primary">au plus haut niveau</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
              Connectez-vous avec les meilleurs talents d&apos;Afrique
              francophone, de la diaspora et du monde entier pour propulser vos
              projets vers l&apos;excellence.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="flex w-full max-w-xl items-center bg-white rounded-xl p-2 shadow-2xl border border-white/10"
            >
              <Search className="ml-2 h-5 w-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un service (ex: UI Design, React, Rédaction...)"
                aria-label="Rechercher un service"
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400 text-sm px-3 py-1"
              />
              <button
                type="submit"
                className="hidden sm:block bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex-shrink-0"
              >
                Rechercher
              </button>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                <Link href="/explorer">Trouver un freelance</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-white/5 backdrop-blur"
              >
                <Link href="/inscription">Devenir Freelance</Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-2">
                {["bg-purple-400", "bg-blue-400", "bg-green-400", "bg-yellow-400"].map(
                  (color, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 border-gray-900 ${color} flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  )
                )}
              </div>
              <p className="text-gray-300 text-sm">
                <span className="font-bold text-white">+15 000</span> freelances
                vérifiés
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
