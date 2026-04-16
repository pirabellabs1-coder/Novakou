// ============================================================
// FreelanceHigh — Communication Settings Store
// Preferences audio/video persistees en localStorage
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VideoQuality = "auto" | "hd" | "sd";

interface CommunicationSettingsState {
  // Peripheriques par defaut (device IDs)
  defaultMicId: string;
  defaultSpeakerId: string;
  defaultCameraId: string;

  // Qualite video
  videoQuality: VideoQuality;

  // Sons et notifications
  soundsEnabled: boolean;
  callNotificationsEnabled: boolean;

  // Actions
  setDefaultMic: (deviceId: string) => void;
  setDefaultSpeaker: (deviceId: string) => void;
  setDefaultCamera: (deviceId: string) => void;
  setVideoQuality: (quality: VideoQuality) => void;
  toggleSounds: () => void;
  toggleCallNotifications: () => void;
}

export const useCommunicationSettings = create<CommunicationSettingsState>()(
  persist(
    (set) => ({
      defaultMicId: "",
      defaultSpeakerId: "",
      defaultCameraId: "",
      videoQuality: "auto",
      soundsEnabled: true,
      callNotificationsEnabled: true,

      setDefaultMic: (deviceId) => set({ defaultMicId: deviceId }),
      setDefaultSpeaker: (deviceId) => set({ defaultSpeakerId: deviceId }),
      setDefaultCamera: (deviceId) => set({ defaultCameraId: deviceId }),
      setVideoQuality: (quality) => set({ videoQuality: quality }),
      toggleSounds: () => set((s) => ({ soundsEnabled: !s.soundsEnabled })),
      toggleCallNotifications: () => set((s) => ({ callNotificationsEnabled: !s.callNotificationsEnabled })),
    }),
    {
      name: "fh-communication-settings",
    }
  )
);
