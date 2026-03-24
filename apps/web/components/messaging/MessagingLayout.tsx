"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useMessagingStore } from "@/store/messaging";
import { useCallStore } from "@/store/call";
import type { UserRole } from "@/store/messaging";
import type { CallType, CallUser } from "@/lib/webrtc/types";
import { useSocket } from "@/lib/socket-provider";
import { ConversationList } from "./ConversationList";
import { ChatPanel } from "./ChatPanel";
import { AudioCallModal } from "./calls/AudioCallModal";
import { VideoCallModal } from "./calls/VideoCallModal";
import { IncomingCallPopup } from "./calls/IncomingCallPopup";
import { useWebRTC } from "./calls/useWebRTC";
import { NewConversationDialog } from "./NewConversationDialog";

interface MessagingLayoutProps {
  userId: string;
  userRole: UserRole;
  showAllConversations?: boolean;
}

function toCallUser(participant: { id: string; name: string; avatar: string; role: string }): CallUser {
  return {
    id: participant.id,
    name: participant.name,
    avatar: participant.avatar,
    role: participant.role,
  };
}

export function MessagingLayout({
  userId,
  userRole,
  showAllConversations = false,
}: MessagingLayoutProps) {
  const {
    conversations,
    setCurrentUser,
    setSelectedConversation,
    sendMessage,
    markConversationRead,
    loadMessages,
    getMyConversations,
    getAllConversations,
    addSystemMessage,
    syncFromApi,
    isLoading,
    isSynced,
    editMessage,
    deleteMessage,
    retryMessage,
    setupSocketListeners,
    startPolling,
    stopPolling,
  } = useMessagingStore();

  const { socket, isConnected, isPollingMode } = useSocket();
  const callStore = useCallStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewConvDialog, setShowNewConvDialog] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const currentUser: CallUser = useMemo(() => ({
    id: userId,
    name: userRole === "admin" ? "Admin" : "Vous",
    avatar: userId.slice(0, 2).toUpperCase(),
    role: userRole,
  }), [userId, userRole]);

  // Call ended callback
  const handleCallEnded = useCallback((callType: CallType, duration: number) => {
    const convId = callStore.conversationId;
    if (!convId) return;
    const msgType = callType === "video" ? "call_video" as const : "call_audio" as const;
    sendMessage(convId, callType === "video" ? "Appel video" : "Appel audio", msgType);
  }, [callStore.conversationId, sendMessage]);

  const handleCallMissed = useCallback((fromUser: CallUser) => {
    const convId = callStore.conversationId || selectedId;
    if (!convId) return;
    sendMessage(convId, "Appel manque", "call_missed");
  }, [callStore.conversationId, selectedId, sendMessage]);

  const {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    initiateCall,
    answerCall,
    rejectCall,
    hangup,
    toggleMuteReal,
    toggleCameraReal,
    toggleScreenShareReal,
  } = useWebRTC({
    currentUser,
    onCallEnded: handleCallEnded,
    onCallMissed: handleCallMissed,
  });

  // Set current user on mount + initial sync
  useEffect(() => {
    setCurrentUser(userId, userRole);
    syncFromApi();
  }, [userId, userRole, setCurrentUser, syncFromApi]);

  // Setup Socket.io listeners OR polling fallback
  useEffect(() => {
    if (socket && isConnected) {
      const cleanup = setupSocketListeners(socket);
      stopPolling();
      return cleanup;
    } else {
      // No socket or disconnected — use polling
      startPolling();
      return () => stopPolling();
    }
  }, [socket, isConnected, setupSocketListeners, startPolling, stopPolling]);

  // Track selected conversation in store
  useEffect(() => {
    setSelectedConversation(selectedId);
  }, [selectedId, setSelectedConversation]);

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

  // Load messages when selecting a conversation
  useEffect(() => {
    if (selectedId && isSynced) {
      loadMessages(selectedId);
    }
  }, [selectedId, isSynced, loadMessages]);

  // Start audio call
  const handleStartAudioCall = useCallback(() => {
    if (!selectedConv) return;
    const otherParticipant = selectedConv.participants.find((p) => p.id !== userId);
    if (!otherParticipant) return;
    initiateCall(toCallUser(otherParticipant), "audio", selectedConv.id);
  }, [selectedConv, userId, initiateCall]);

  // Start video call
  const handleStartVideoCall = useCallback(() => {
    if (!selectedConv) return;
    const otherParticipant = selectedConv.participants.find((p) => p.id !== userId);
    if (!otherParticipant) return;
    initiateCall(toCallUser(otherParticipant), "video", selectedConv.id);
  }, [selectedConv, userId, initiateCall]);

  const handleSwitchToVideo = useCallback(() => {
    useCallStore.getState().setCallType("video");
  }, []);

  const handleToggleScreenShare = useCallback(async () => {
    toggleScreenShareReal();
  }, [toggleScreenShareReal]);

  const handleSelectConversation = useCallback((convId: string) => {
    setSelectedId(convId);
    setMobileShowChat(true);
  }, []);

  const handleMobileBack = useCallback(() => {
    setMobileShowChat(false);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {showAllConversations && (
        <NewConversationDialog
          open={showNewConvDialog}
          onClose={() => setShowNewConvDialog(false)}
          onConversationCreated={(convId) => handleSelectConversation(convId)}
        />
      )}

      <div className="flex flex-1 min-h-0 bg-background-dark/50 overflow-hidden">
        {/* Conversations sidebar */}
        <div className={`w-full md:w-80 border-r border-border-dark flex-shrink-0 flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
          {showAllConversations && (
            <div className="p-3 border-b border-border-dark">
              <button
                onClick={() => setShowNewConvDialog(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">edit_square</span>
                Nouvelle conversation
              </button>
            </div>
          )}
          <ConversationList
            conversations={myConversations}
            currentUserId={userId}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            showTypeFilter={userRole === "agence"}
            showAllTypes={showAllConversations}
            isLoading={isLoading}
          />
        </div>

        {/* Chat area */}
        <div className={`flex-1 min-w-0 min-h-0 ${mobileShowChat ? "flex" : "hidden md:flex"} flex-col overflow-hidden`}>
          <ChatPanel
            conversation={selectedConv}
            currentUserId={userId}
            onSendMessage={(content, type, fileName, fileSize, audioUrl, audioDuration, fileUrl, fileType, storagePath) => {
              if (selectedId) {
                sendMessage(selectedId, content, type, fileName, fileSize, audioUrl, audioDuration, fileUrl, fileType, storagePath);
              }
            }}
            onEditMessage={(messageId, newContent) => {
              if (selectedId) editMessage(selectedId, messageId, newContent);
            }}
            onDeleteMessage={(messageId) => {
              if (selectedId) deleteMessage(selectedId, messageId);
            }}
            onRetryMessage={(messageId) => {
              if (selectedId) retryMessage(selectedId, messageId);
            }}
            onMarkRead={() => {
              if (selectedId) markConversationRead(selectedId);
            }}
            showAdminActions={showAllConversations}
            onSendSystemMessage={
              showAllConversations
                ? (content) => { if (selectedId) addSystemMessage(selectedId, content); }
                : undefined
            }
            onStartAudioCall={handleStartAudioCall}
            onStartVideoCall={handleStartVideoCall}
            onMobileBack={handleMobileBack}
          />
        </div>
      </div>

      {/* Call modals */}
      {callState === "ringing" && remoteUser && (
        <IncomingCallPopup
          caller={remoteUser}
          callType={callType}
          onAccept={() => answerCall()}
          onAcceptAudioOnly={callType === "video" ? () => answerCall("audio") : undefined}
          onReject={() => rejectCall()}
          onMissed={() => {
            if (selectedId) sendMessage(selectedId, "Appel manque", "call_missed");
          }}
        />
      )}

      {(callState === "calling" || callState === "connecting" || callState === "connected" || callState === "reconnecting") && callType === "audio" && (
        <AudioCallModal
          remoteStream={remoteStream}
          onHangup={hangup}
          onSwitchToVideo={handleSwitchToVideo}
          onToggleMute={toggleMuteReal}
        />
      )}

      {(callState === "calling" || callState === "connecting" || callState === "connected" || callState === "reconnecting") && callType === "video" && (
        <VideoCallModal
          localStream={localStream}
          remoteStream={remoteStream}
          onHangup={hangup}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleMute={toggleMuteReal}
          onToggleCamera={toggleCameraReal}
        />
      )}
    </div>
  );
}
