"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Redirect to the unified messages inbox.
 * The vendeur nav now points to /formations/messages directly,
 * but keep this page as a redirect for any bookmarked URLs.
 */
export default function VendeurMessagesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/messages");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2 text-[#5c647a] text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        Redirection vers les messages…
      </div>
    </div>
  );
}
