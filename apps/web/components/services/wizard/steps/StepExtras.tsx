"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useServiceWizardStore, type ServiceOptionDraft } from "@/store/service-wizard";
import { OPTIONS_LIMITS } from "@/lib/validations/service";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableOption({
  option,
  onEdit,
  onDelete,
  onToggleRecommended,
}: {
  option: ServiceOptionDraft;
  onEdit: () => void;
  onDelete: () => void;
  onToggleRecommended: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 group">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300">
          <span className="material-symbols-outlined">drag_indicator</span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{option.title}</h4>
            {option.isRecommended && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase">
                Recommandé
              </span>
            )}
          </div>
          {option.description && <p className="text-xs text-slate-400 mb-2">{option.description}</p>}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>+{option.extraPrice} EUR</span>
            <span>+{option.extraDays} jour{option.extraDays > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onToggleRecommended} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors" title="Recommandé">
            <span className="material-symbols-outlined text-lg">{option.isRecommended ? "star" : "star_outline"}</span>
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Modifier">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="Supprimer">
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StepExtras({ role }: { role: string }) {
  const store = useServiceWizardStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", extraPrice: 0, extraDays: 0 });
  const [formError, setFormError] = useState("");

  const userPlan = "GRATUIT";
  const limit = OPTIONS_LIMITS[userPlan] || 3;
  const canAdd = store.options.length < limit;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = store.options.findIndex((o) => o.id === active.id);
      const newIndex = store.options.findIndex((o) => o.id === over.id);
      store.reorderOptions(arrayMove(store.options, oldIndex, newIndex));
    }
  }

  function openAddForm() {
    setEditingId(null);
    setFormData({ title: "", description: "", extraPrice: 0, extraDays: 0 });
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(option: ServiceOptionDraft) {
    setEditingId(option.id);
    setFormData({
      title: option.title,
      description: option.description,
      extraPrice: option.extraPrice,
      extraDays: option.extraDays,
    });
    setFormError("");
    setShowForm(true);
  }

  function saveOption() {
    if (!formData.title.trim()) {
      setFormError("Le titre est requis");
      return;
    }

    if (editingId) {
      store.updateOption(editingId, formData);
    } else {
      store.addOption({
        id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...formData,
        isRecommended: false,
        sortOrder: store.options.length,
        expressEnabled: false,
        expressPrice: 0,
        expressDaysReduction: 0,
      });
    }
    setShowForm(false);
  }

  function toggleRecommended(id: string) {
    // Only one can be recommended at a time
    store.options.forEach((o) => {
      if (o.id === id) {
        store.updateOption(o.id, { isRecommended: !o.isRecommended });
      } else if (o.isRecommended) {
        store.updateOption(o.id, { isRecommended: false });
      }
    });
  }

  function handleNext() {
    store.markStepCompleted(4);
    store.setStep(5);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Ajoutez des options supplémentaires pour augmenter le panier moyen.
        <span className="text-slate-500"> (Facultatif)</span>
      </p>

      {/* Options list */}
      {store.options.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={store.options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {store.options.map((option) => (
                <SortableOption
                  key={option.id}
                  option={option}
                  onEdit={() => openEditForm(option)}
                  onDelete={() => store.removeOption(option.id)}
                  onToggleRecommended={() => toggleRecommended(option.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-sm">{editingId ? "Modifier l'option" : "Nouvelle option"}</h4>
          <div>
            <label className="block text-xs font-semibold mb-1">Titre de l&apos;option</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Pack Premium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description courte</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Description de l'option..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Prix supplémentaire (EUR)</label>
              <input
                type="number"
                value={formData.extraPrice || ""}
                onChange={(e) => setFormData({ ...formData, extraPrice: Number(e.target.value) })}
                min={0}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Délai supplémentaire (jours)</label>
              <input
                type="number"
                value={formData.extraDays || ""}
                onChange={(e) => setFormData({ ...formData, extraDays: Number(e.target.value) })}
                min={0}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={saveOption} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
              {editingId ? "Sauvegarder" : "Ajouter"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={openAddForm}
          disabled={!canAdd}
          className={cn(
            "w-full py-3 border-2 border-dashed rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
            canAdd
              ? "border-primary/30 text-primary hover:bg-primary/5"
              : "border-white/10 text-slate-500 cursor-not-allowed"
          )}
        >
          <span className="material-symbols-outlined">add</span>
          Ajouter une option
        </button>
      )}

      {!canAdd && (
        <p className="text-xs text-amber-400 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">info</span>
          Vous avez atteint la limite de {limit} options pour le plan {userPlan}. Passez au plan Pro pour en ajouter jusqu&apos;à 10.
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-white/5">
        <button onClick={() => store.setStep(3)} className="inline-flex items-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Précédent
        </button>
        <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
          Enregistrer et suivant
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
