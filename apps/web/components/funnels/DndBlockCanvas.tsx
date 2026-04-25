"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

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
}

// ─── DndBlockCanvas (native HTML5 drag-and-drop) ─────────────
export default function DndBlockCanvas({
  blocks,
  onReorder,
  renderBlock,
}: DndBlockCanvasProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, idx: number) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    // Make ghost semi-transparent
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const next = [...blocks];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(overIdx, 0, moved);
      onReorder(next);
    }
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
  }, [blocks, dragIdx, overIdx, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  }, []);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <div
          key={block.id}
          draggable
          onDragStart={(e) => handleDragStart(e, i)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragEnter={(e) => { e.preventDefault(); setOverIdx(i); }}
          className="group/block relative"
        >
          {/* Drop indicator line */}
          {overIdx === i && dragIdx !== null && dragIdx !== i && (
            <div className="absolute -top-2 left-0 right-0 h-1 bg-[#006e2f] rounded-full z-20 shadow-[0_0_8px_rgba(0,110,47,0.4)]" />
          )}
          {/* Drag handle */}
          <div
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm opacity-0 group-hover/block:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:border-[#006e2f] hover:text-[#006e2f] text-[#5c647a]"
            title="Glisser pour réorganiser"
          >
            <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
          </div>
          {renderBlock(block, i)}
        </div>
      ))}
    </div>
  );
}
