"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus, Trash2, GripVertical, Save, Eye, Globe, ChevronUp, ChevronDown,
  Type, Image as ImageIcon, Video, Columns, DollarSign, MessageSquare, HelpCircle,
  MousePointer, Heading,
} from "lucide-react";
import { useInstructorSalesFunnel, useInstructorMutation, instructorKeys } from "@/lib/formations/hooks";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Block types
type BlockType = "HERO" | "TEXT" | "IMAGE" | "VIDEO" | "COLUMNS" | "PRICING" | "TESTIMONIALS" | "FAQ" | "CTA";

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

interface Funnel {
  id: string;
  slug: string;
  published: boolean;
  blocks: Block[];
  formation: {
    title: string;
    price: number;
    originalPrice: number | null;
    thumbnail: string | null;
  };
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "HERO", label: "Hero", icon: Heading, desc: "Titre + sous-titre + image + CTA" },
  { type: "TEXT", label: "Texte", icon: Type, desc: "Bloc de texte riche" },
  { type: "IMAGE", label: "Image", icon: ImageIcon, desc: "Image avec légende" },
  { type: "VIDEO", label: "Vidéo", icon: Video, desc: "Vidéo YouTube/Vimeo" },
  { type: "COLUMNS", label: "Colonnes", icon: Columns, desc: "2-3 colonnes de contenu" },
  { type: "PRICING", label: "Prix", icon: DollarSign, desc: "Affichage du prix + CTA" },
  { type: "TESTIMONIALS", label: "Témoignages", icon: MessageSquare, desc: "Avis de clients" },
  { type: "FAQ", label: "FAQ", icon: HelpCircle, desc: "Questions/réponses" },
  { type: "CTA", label: "Bouton CTA", icon: MousePointer, desc: "Bouton d'action" },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

function SortableBlock({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} {...attributes}>
      <div className="relative group">
        <div data-drag-handle {...listeners} className="absolute left-2 top-4 cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        {children}
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange, onDelete }: { block: Block; onChange: (data: Record<string, unknown>) => void; onDelete: () => void }) {
  const d = block.data;
  const set = (key: string, val: unknown) => onChange({ ...d, [key]: val });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-primary uppercase">{block.type}</span>
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {block.type === "HERO" && (
        <div className="space-y-3">
          <input value={String(d.title ?? "")} onChange={(e) => set("title", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="Titre principal" />
          <input value={String(d.subtitle ?? "")} onChange={(e) => set("subtitle", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="Sous-titre" />
          <input value={String(d.bgImage ?? "")} onChange={(e) => set("bgImage", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="URL image de fond" />
          <input value={String(d.ctaText ?? "Acheter maintenant")} onChange={(e) => set("ctaText", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="Texte du bouton" />
        </div>
      )}

      {block.type === "TEXT" && (
        <textarea value={String(d.content ?? "")} onChange={(e) => set("content", e.target.value)} rows={6} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm resize-y" placeholder="Votre texte ici..." />
      )}

      {block.type === "IMAGE" && (
        <div className="space-y-3">
          <input value={String(d.url ?? "")} onChange={(e) => set("url", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="URL de l'image" />
          <input value={String(d.alt ?? "")} onChange={(e) => set("alt", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="Texte alternatif" />
          <select value={String(d.size ?? "medium")} onChange={(e) => set("size", e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm">
            <option value="small">Petite</option>
            <option value="medium">Moyenne</option>
            <option value="full">Pleine largeur</option>
          </select>
        </div>
      )}

      {block.type === "VIDEO" && (
        <input value={String(d.url ?? "")} onChange={(e) => set("url", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="URL YouTube ou Vimeo" />
      )}

      {block.type === "COLUMNS" && (
        <div className="space-y-3">
          <select value={String(d.count ?? 2)} onChange={(e) => set("count", parseInt(e.target.value))} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm">
            <option value={2}>2 colonnes</option>
            <option value={3}>3 colonnes</option>
          </select>
          {Array.from({ length: Number(d.count ?? 2) }).map((_, i) => (
            <textarea key={i} value={String((d[`col${i}`] as string) ?? "")} onChange={(e) => set(`col${i}`, e.target.value)} rows={3} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm resize-y" placeholder={`Contenu colonne ${i + 1}`} />
          ))}
        </div>
      )}

      {block.type === "PRICING" && (
        <p className="text-sm text-slate-500">Le prix de la formation sera affiché automatiquement avec un bouton d&apos;achat.</p>
      )}

      {block.type === "TESTIMONIALS" && (
        <div className="space-y-3">
          {(Array.isArray(d.items) ? d.items : []).map((t: { name: string; text: string; rating: number }, i: number) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <input value={t.name} onChange={(e) => { const items = [...(d.items as typeof t[])]; items[i] = { ...t, name: e.target.value }; set("items", items); }} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-sm" placeholder="Nom" />
                <textarea value={t.text} onChange={(e) => { const items = [...(d.items as typeof t[])]; items[i] = { ...t, text: e.target.value }; set("items", items); }} rows={2} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-sm resize-none" placeholder="Témoignage" />
              </div>
              <button onClick={() => { const items = (d.items as typeof t[]).filter((_, j) => j !== i); set("items", items); }} className="text-slate-400 hover:text-red-500 mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button onClick={() => set("items", [...(Array.isArray(d.items) ? d.items : []), { name: "", text: "", rating: 5 }])} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter un témoignage</button>
        </div>
      )}

      {block.type === "FAQ" && (
        <div className="space-y-3">
          {(Array.isArray(d.items) ? d.items : []).map((item: { q: string; a: string }, i: number) => (
            <div key={i} className="space-y-1">
              <div className="flex gap-2">
                <input value={item.q} onChange={(e) => { const items = [...(d.items as typeof item[])]; items[i] = { ...item, q: e.target.value }; set("items", items); }} className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-sm font-medium" placeholder="Question" />
                <button onClick={() => { const items = (d.items as typeof item[]).filter((_, j) => j !== i); set("items", items); }} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <textarea value={item.a} onChange={(e) => { const items = [...(d.items as typeof item[])]; items[i] = { ...item, a: e.target.value }; set("items", items); }} rows={2} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-sm resize-none" placeholder="Réponse" />
            </div>
          ))}
          <button onClick={() => set("items", [...(Array.isArray(d.items) ? d.items : []), { q: "", a: "" }])} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter une question</button>
        </div>
      )}

      {block.type === "CTA" && (
        <div className="space-y-3">
          <input value={String(d.text ?? "Commencer la formation")} onChange={(e) => set("text", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="Texte du bouton" />
          <input value={String(d.url ?? "")} onChange={(e) => set("url", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm" placeholder="URL de destination (vide = checkout)" />
        </div>
      )}
    </div>
  );
}

export default function SalesFunnelBuilderPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: funnelData, isLoading: loading, error: queryError, refetch } = useInstructorSalesFunnel(id);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!seeded && funnelData) {
      const data = funnelData as { funnel?: Funnel };
      if (data.funnel) {
        setFunnel(data.funnel);
        setBlocks(Array.isArray(data.funnel.blocks) ? data.funnel.blocks.map((b: Block) => ({ ...b, id: b.id ?? generateId() })) : []);
      }
      setSeeded(true);
    }
  }, [funnelData, seeded]);

  const saveMutation = useInstructorMutation(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/instructeur/sales-funnel/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    [instructorKeys.salesFunnel(id), instructorKeys.salesFunnels()]
  );

  const saveBlocks = useCallback((publish?: boolean) => {
    const body: Record<string, unknown> = { blocks };
    if (publish !== undefined) body.published = publish;
    saveMutation.mutate(body, {
      onSuccess: () => {
        if (publish !== undefined && funnel) {
          setFunnel({ ...funnel, published: publish });
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  }, [blocks, funnel, saveMutation]);

  const saving = saveMutation.isPending;

  const addBlock = (type: BlockType) => {
    const defaults: Record<BlockType, Record<string, unknown>> = {
      HERO: { title: "", subtitle: "", bgImage: "", ctaText: "Acheter maintenant" },
      TEXT: { content: "" },
      IMAGE: { url: "", alt: "", size: "medium" },
      VIDEO: { url: "" },
      COLUMNS: { count: 2, col0: "", col1: "" },
      PRICING: {},
      TESTIMONIALS: { items: [] },
      FAQ: { items: [] },
      CTA: { text: "Commencer la formation", url: "" },
    };
    setBlocks([...blocks, { id: generateId(), type, data: defaults[type] }]);
    setShowPalette(false);
  };

  const updateBlock = (blockId: string, data: Record<string, unknown>) => {
    setBlocks(blocks.map((b) => b.id === blockId ? { ...b, data } : b));
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  if (loading) return <div className="p-4 sm:p-6 lg:p-8"><div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /></div>;
  if (queryError) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-500 mb-4">{(queryError as Error)?.message || "Erreur lors du chargement"}</p>
        <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
          Réessayer
        </button>
      </div>
    </div>
  );
  if (!funnel) return <div className="p-4 sm:p-6 lg:p-8 text-center text-slate-400">Tunnel introuvable</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Éditeur de tunnel</h1>
          <p className="text-sm text-slate-500">{funnel.formation?.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-500 font-medium">Sauvegardé</span>}
          <button onClick={() => saveBlocks()} disabled={saving} className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-sm px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "..." : "Sauvegarder"}
          </button>
          {funnel.slug && (
            <a href={`/formations/vente/${funnel.slug}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-sm px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
              <Eye className="w-4 h-4" /> Prévisualiser
            </a>
          )}
          <button
            onClick={() => saveBlocks(!funnel.published)}
            disabled={saving}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium transition-colors ${
              funnel.published
                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            <Globe className="w-4 h-4" /> {funnel.published ? "Dépublier" : "Publier"}
          </button>
        </div>
      </div>

      {/* Blocks */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {blocks.map((block) => (
              <SortableBlock key={block.id} id={block.id}>
                <BlockEditor
                  block={block}
                  onChange={(data) => updateBlock(block.id, data)}
                  onDelete={() => removeBlock(block.id)}
                />
              </SortableBlock>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <p className="mb-2">Aucun bloc</p>
          <p className="text-sm">Ajoutez des blocs pour construire votre page de vente</p>
        </div>
      )}

      {/* Add block */}
      {showPalette ? (
        <div className="bg-white dark:bg-slate-900 border border-primary/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Ajouter un bloc</span>
            <button onClick={() => setShowPalette(false)} className="text-slate-400 hover:text-slate-600"><ChevronUp className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BLOCK_TYPES.map(({ type, label, icon: Icon, desc }) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-colors text-center"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">{label}</span>
                <span className="text-[10px] text-slate-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPalette(true)}
          className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/40 py-3 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter un bloc
        </button>
      )}
    </div>
  );
}
