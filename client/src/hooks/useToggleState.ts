// hooks/useToggleState.ts
import { useState, useCallback } from 'react';

/**
 * 범용 토글 상태 훅
 * - 상태는 개별적이지만 로직은 공통화
 * - Popover, Dropdown, Modal 등에서 재사용 가능
 */
export function useToggleState(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
  };
}
