"use client";

import { MessagingLayout } from "@/components/messaging/MessagingLayout";

export default function FreelanceMessagesPage() {
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <MessagingLayout
        userId="u1"
        userRole="freelance"
        title="Messagerie"
      />
    </div>
  );
}
