import { useState, useCallback } from 'react';

export function useModalState<T = unknown>(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((contextData: T | null = null) => {
    setData(contextData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (prev) {
        setData(null);
      }
      return !prev;
    });
  }, []);

  const openForEdit = useCallback((item: T) => {
    open(item);
  }, [open]);

  const openForCreate = useCallback(() => {
    open(null);
  }, [open]);

  return {
    isOpen,
    data,
    setIsOpen,
    open,
    close,
    toggle,
    openForEdit,
    openForCreate
  };
}
