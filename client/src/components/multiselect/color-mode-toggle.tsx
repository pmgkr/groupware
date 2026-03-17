'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useState } from 'react';

export function ColorModeToggle() {
  const [isGrayMode, setIsGrayMode] = useState(false);

  const toggleGrayMode = () => {
    setIsGrayMode(!isGrayMode);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleGrayMode}
      className={`relative transition-all duration-300 ${
        isGrayMode
          ? 'hover:bg-muted bg-transparent'
          : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
      }`}
      title={isGrayMode ? 'Enable Colors' : 'Disable Colors'}>
      {isGrayMode ? <Icons.eyeOff className="text-muted-foreground h-5 w-5" /> : <Icons.eye className="h-5 w-5" />}
      <span className="sr-only">{isGrayMode ? 'Enable Colors' : 'Disable Colors'}</span>
    </Button>
  );
}
