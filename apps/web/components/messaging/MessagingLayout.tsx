"use client";

import { useState, useMemo, useEffect } from "react";
import { useMessagingStore } from "@/store/messaging";
import type { UserRole } from "@/store/messaging";
import { ConversationList } from "./ConversationList";
import { ChatPanel } from "./ChatPanel";

interface MessagingLayoutProps {
  userId: string;
  userRole: UserRole;
  showAllConversations?: boolean; // mode admin
  title?: string;
}

export function MessagingLayout({
  userId,
  userRole,
  showAllConversations = false,
  title = "Messagerie",
}: MessagingLayoutProps) {
  const {
    conversations,
    setCurrentUser,
    sendMessage,
    markConversationRead,
    getMyConversations,
    getAllConversations,
    addSystemMessage,
  } = useMessagingStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Set current user on mount
  useEffect(() => {
    setCurrentUser(userId, userRole);
  }, [userId, userRole, setCurrentUser]);

  const myConversations = useMemo(() => {
    return showAllConversations ? getAllConversations() : getMyConversations();
  }, [conversations, showAllConversations, getAllConversations, getMyConversations]);

  // Auto-select first conversation
  useEffect(() => {
    if (!selectedId && myConversations.length > 0) {
      setSelectedId(myConversations[0].id);
    }
  }, [myConversations, selectedId]);

  const selectedConv = useMemo(
    () => myConversations.find((c) => c.id === selectedId) ?? null,
    [myConversations, selectedId]
  );

  const totalUnread = myConversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
        <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="text-slate-400 mt-1">
          {totalUnread > 0
            ? `${totalUnread} message(s) non lu(s)`
            : "Toutes les conversations sont a jour."}
        </p>
      </div>

      <div className="flex flex-1 min-h-0 bg-background-dark/50 border-t border-border-dark overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-80 border-r border-border-dark flex-shrink-0">
          <ConversationList
            conversations={myConversations}
            currentUserId={userId}
            selectedId={selectedId}
            onSelect={setSelectedId}
            showTypeFilter={userRole === "agence"}
            showAllTypes={showAllConversations}
          />
        </div>

        {/* Chat area */}
        <ChatPanel
          conversation={selectedConv}
          currentUserId={userId}
          onSendMessage={(content, type, fileName, fileSize) => {
            if (selectedId) {
              sendMessage(selectedId, content, type, fileName, fileSize);
            }
          }}
          onMarkRead={() => {
            if (selectedId) markConversationRead(selectedId);
          }}
          showAdminActions={showAllConversations}
          onSendSystemMessage={
            showAllConversations
              ? (content) => {
                  if (selectedId) addSystemMessage(selectedId, content);
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
