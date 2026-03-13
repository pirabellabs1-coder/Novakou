"use client";

import Link from "next/link";
import { useMessagingStore } from "@/store/messaging";

interface MessagesBadgeProps {
  role: string;
}

export function MessagesBadge({ role }: MessagesBadgeProps) {
  const conversations = useMessagingStore((s) => s.conversations);
  const currentUserId = useMessagingStore((s) => s.currentUserId);

  // Count total unread across conversations where user is a participant
  const unreadCount = conversations
    .filter((c) => c.participants.some((p) => p.id === currentUserId))
    .reduce((sum, c) => sum + c.unreadCount, 0);

  const msgHref =
    role === "admin"
      ? "/admin/messages"
      : `/${role === "freelance" ? "dashboard" : role}/messages`;

  return (
    <Link
      href={msgHref}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
      title="Messages"
    >
      <span className="material-symbols-outlined text-xl">chat_bubble</span>
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-primary text-[#0f1117] text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
