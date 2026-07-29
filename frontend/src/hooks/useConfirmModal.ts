import { useState, useCallback } from 'react';

interface ConfirmModalState {
  isOpen: boolean;
  itemId: string | null;
  itemName: string;
}

export function useConfirmModal() {
  const [state, setState] = useState<ConfirmModalState>({
    isOpen: false,
    itemId: null,
    itemName: ''
  });

  const open = useCallback((id: string, name = '') => {
    setState({
      isOpen: true,
      itemId: id,
      itemName: name
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      itemId: null,
      itemName: ''
    });
  }, []);

  const confirm = useCallback(async (callback: (id: string) => Promise<void> | void) => {
    if (state.itemId && callback) {
      await callback(state.itemId);
    }
    close();
  }, [state.itemId, close]);

  return {
    isOpen: state.isOpen,
    itemId: state.itemId,
    itemName: state.itemName,
    confirmDelete: state,
    setConfirmDelete: setState,
    open,
    close,
    confirm
  };
}
