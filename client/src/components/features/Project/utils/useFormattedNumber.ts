import { useRef } from 'react';

// formatAmount는 기존 함수 그대로 사용하면 됨
export function useFormattedNumberInput(formatFn: (n: number) => string) {
  const cursorRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, onRawChange: (v: number | '') => void) => {
    const el = e.target;
    cursorRef.current = el.selectionStart ?? 0;

    // raw 숫자만 추출
    const numeric = el.value.replace(/[^\d]/g, '');

    if (numeric === '') {
      onRawChange('');
      return;
    }

    const rawValue = Number(numeric);
    onRawChange(rawValue);

    // format 적용
    setTimeout(() => {
      if (!inputRef.current) return;

      const formatted = formatFn(rawValue);
      inputRef.current.value = formatted;

      // 커서 재계산
      const diff = formatted.length - numeric.length;
      const newPos = cursorRef.current + diff;

      inputRef.current.setSelectionRange(newPos, newPos);
    });
  };

  return { inputRef, handleChange };
}
