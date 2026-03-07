"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──

export interface UploadedImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

export interface PackageFeature {
  id: string;
  label: string;
  includedInBasic: boolean;
  includedInStandard: boolean;
  includedInPremium: boolean;
}

export interface PackageTier {
  name: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  description: string;
}

export interface PackagesDraft {
  basic: PackageTier;
  standard: PackageTier;
  premium: PackageTier;
  features: PackageFeature[];
}

export interface ServiceOptionDraft {
  id: string;
  title: string;
  description: string;
  extraPrice: number;
  extraDays: number;
  isRecommended: boolean;
  sortOrder: number;
  expressEnabled: boolean;
  expressPrice: number;
  expressDaysReduction: number;
}

export interface ExpressDeliveryConfig {
  baseExpressEnabled: boolean;
  baseExpressPrice: number;
  baseExpressDaysReduction: number;
}

// ── Store State ──

export interface ServiceWizardState {
  // Metadata
  currentStep: number;
  serviceId: string | null;
  lastSavedAt: string | null; // ISO string for serialization
  isDirty: boolean;
  isSaving: boolean;

  // Step 1 — Titre et Catégorie
  language: string;
  title: string;
  categoryId: string;
  subCategoryId: string;
  tags: string[];

  // Step 2 — Prix et Description
  basePrice: number;
  baseDeliveryDays: number;
  description: any | null; // Tiptap JSON

  // Step 3 — Forfaits B/S/P
  packages: PackagesDraft;

  // Step 4 — Options Supplémentaires
  options: ServiceOptionDraft[];

  // Step 5 — Livraison Express
  expressDelivery: ExpressDeliveryConfig;

  // Step 6 — Consignes de Réalisation
  instructionsRequired: boolean;
  instructionsContent: any | null; // Tiptap JSON

  // Step 7 — Galerie Médias
  mainImage: UploadedImage | null;
  additionalImages: UploadedImage[];
  videoUrl: string;

  // Step completion tracking
  completedSteps: number[];

  // Actions
  setStep: (step: number) => void;
  updateField: <K extends keyof ServiceWizardState>(
    key: K,
    value: ServiceWizardState[K]
  ) => void;
  updateFields: (fields: Partial<ServiceWizardState>) => void;
  markStepCompleted: (step: number) => void;
  unmarkStepCompleted: (step: number) => void;
  markSaving: (saving: boolean) => void;
  markSaved: () => void;
  markDirty: () => void;

  // Options management
  addOption: (option: ServiceOptionDraft) => void;
  updateOption: (id: string, updates: Partial<ServiceOptionDraft>) => void;
  removeOption: (id: string) => void;
  reorderOptions: (options: ServiceOptionDraft[]) => void;

  // Images management
  setMainImage: (image: UploadedImage | null) => void;
  addAdditionalImage: (image: UploadedImage) => void;
  removeAdditionalImage: (id: string) => void;
  reorderAdditionalImages: (images: UploadedImage[]) => void;

  // Reset
  reset: () => void;
  loadDraft: (data: Partial<ServiceWizardState>) => void;
}

// ── Initial State ──

const initialState: Omit<
  ServiceWizardState,
  | "setStep"
  | "updateField"
  | "updateFields"
  | "markStepCompleted"
  | "unmarkStepCompleted"
  | "markSaving"
  | "markSaved"
  | "markDirty"
  | "addOption"
  | "updateOption"
  | "removeOption"
  | "reorderOptions"
  | "setMainImage"
  | "addAdditionalImage"
  | "removeAdditionalImage"
  | "reorderAdditionalImages"
  | "reset"
  | "loadDraft"
> = {
  currentStep: 1,
  serviceId: null,
  lastSavedAt: null,
  isDirty: false,
  isSaving: false,

  language: "fr",
  title: "",
  categoryId: "",
  subCategoryId: "",
  tags: [],

  basePrice: 10,
  baseDeliveryDays: 7,
  description: null,

  packages: {
    basic: { name: "Basique", price: 10, deliveryDays: 7, revisions: 1, description: "" },
    standard: { name: "Standard", price: 20, deliveryDays: 5, revisions: 3, description: "" },
    premium: { name: "Premium", price: 30, deliveryDays: 3, revisions: 5, description: "" },
    features: [],
  },

  options: [],

  expressDelivery: {
    baseExpressEnabled: false,
    baseExpressPrice: 0,
    baseExpressDaysReduction: 0,
  },

  instructionsRequired: false,
  instructionsContent: null,

  mainImage: null,
  additionalImages: [],
  videoUrl: "",

  completedSteps: [],
};

// ── Store ──

export const useServiceWizardStore = create<ServiceWizardState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      updateField: (key, value) =>
        set((state) => ({ ...state, [key]: value, isDirty: true })),

      updateFields: (fields) =>
        set((state) => ({ ...state, ...fields, isDirty: true })),

      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step].sort((a, b) => a - b),
        })),

      unmarkStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.filter((s) => s !== step),
        })),

      markSaving: (saving) => set({ isSaving: saving }),

      markSaved: () =>
        set({ lastSavedAt: new Date().toISOString(), isDirty: false, isSaving: false }),

      markDirty: () => set({ isDirty: true }),

      // Options
      addOption: (option) =>
        set((state) => ({
          options: [...state.options, option],
          isDirty: true,
        })),

      updateOption: (id, updates) =>
        set((state) => ({
          options: state.options.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
          isDirty: true,
        })),

      removeOption: (id) =>
        set((state) => ({
          options: state.options
            .filter((o) => o.id !== id)
            .map((o, i) => ({ ...o, sortOrder: i })),
          isDirty: true,
        })),

      reorderOptions: (options) =>
        set({
          options: options.map((o, i) => ({ ...o, sortOrder: i })),
          isDirty: true,
        }),

      // Images
      setMainImage: (image) => set({ mainImage: image, isDirty: true }),

      addAdditionalImage: (image) =>
        set((state) => ({
          additionalImages: [...state.additionalImages, image],
          isDirty: true,
        })),

      removeAdditionalImage: (id) =>
        set((state) => ({
          additionalImages: state.additionalImages.filter((i) => i.id !== id),
          isDirty: true,
        })),

      reorderAdditionalImages: (images) =>
        set({ additionalImages: images, isDirty: true }),

      // Reset
      reset: () => set(initialState),

      loadDraft: (data) =>
        set((state) => ({
          ...state,
          ...data,
          isDirty: false,
        })),
    }),
    {
      name: "freelancehigh-service-wizard",
      partialize: (state) => ({
        currentStep: state.currentStep,
        serviceId: state.serviceId,
        lastSavedAt: state.lastSavedAt,
        language: state.language,
        title: state.title,
        categoryId: state.categoryId,
        subCategoryId: state.subCategoryId,
        tags: state.tags,
        basePrice: state.basePrice,
        baseDeliveryDays: state.baseDeliveryDays,
        description: state.description,
        packages: state.packages,
        options: state.options,
        expressDelivery: state.expressDelivery,
        instructionsRequired: state.instructionsRequired,
        instructionsContent: state.instructionsContent,
        mainImage: state.mainImage,
        additionalImages: state.additionalImages,
        videoUrl: state.videoUrl,
        completedSteps: state.completedSteps,
      }),
    }
  )
);
