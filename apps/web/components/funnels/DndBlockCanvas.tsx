"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ───────────────────────────────────────────────────
interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface DndBlockCanvasProps {
  blocks: Block[];
  onReorder: (blocks: Block[]) => void;
  renderBlock: (block: Block, index: number) => ReactNode;
  renderOverlay?: (block: Block) => ReactNode;
}

// ─── SortableBlockItem ───────────────────────────────────────
function SortableBlockItem({
  block,
  children,
}: {
  block: Block;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/block relative">
      {/* Drag handle — 6-dot grip icon */}
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm opacity-0 group-hover/block:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:border-[#006e2f] hover:text-[#006e2f] text-[#5c647a]"
        title="Glisser pour réorganiser"
        aria-label="Glisser pour réorganiser"
      >
        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
      </button>
      {children}
    </div>
  );
}

// ─── DndBlockCanvas ──────────────────────────────────────────
export default function DndBlockCanvas({
  blocks,
  onReorder,
  renderBlock,
  renderOverlay,
}: DndBlockCanvasProps) {
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const found = blocks.find((b) => b.id === event.active.id);
    setActiveBlock(found ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveBlock(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {blocks.map((block, i) => (
            <SortableBlockItem key={block.id} block={block}>
              {renderBlock(block, i)}
            </SortableBlockItem>
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div className="opacity-80 shadow-2xl rounded-2xl ring-2 ring-[#006e2f] scale-[1.02] pointer-events-none">
            {renderOverlay ? renderOverlay(activeBlock) : (
              <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#006e2f] text-[20px]">drag_indicator</span>
                <span className="text-sm font-bold text-[#191c1e] capitalize">{activeBlock.type}</span>
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
