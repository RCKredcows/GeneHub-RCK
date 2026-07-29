import type React from 'react';
import { useState, useCallback } from 'react';

interface DraggableItem {
  id: string;
  [key: string]: unknown;
}

/**
 * Hook to handle drag-and-drop reordering of items
 */
export function useDragReorder<T extends DraggableItem>(items: T[], onReorder: (items: T[]) => void) {
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [dragOverItem, setDragOverItem] = useState<T | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, item: T) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    setTimeout(() => {
      (e.target as HTMLElement).closest('[data-draggable]')?.classList.add('dragging');
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).closest('[data-draggable]')?.classList.remove('dragging');
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, item: T) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && item.id !== draggedItem.id) {
      setDragOverItem(item);
    }
  }, [draggedItem]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetItem: T) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    const targetIndex = items.findIndex(item => item.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...items];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    onReorder(reordered);
    setDraggedItem(null);
    setDragOverItem(null);
  }, [draggedItem, items, onReorder]);

  const isDragOver = useCallback((item: T) => {
    return dragOverItem?.id === item.id;
  }, [dragOverItem]);

  return {
    draggedItem,
    isDragOver,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}
