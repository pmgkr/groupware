import { Outlet } from 'react-router';
import { createContext } from 'react';
import { BOARD_ID_MAP } from '@/api';

export const BoardContext = createContext<{
  boardType: 'notice' | 'suggest';
  boardId: number;
} | null>(null);

export default function BoardLayout({ boardType }: { boardType: 'notice' | 'suggest' }) {
  return (
    <BoardContext.Provider
      value={{
        boardType,
        boardId: BOARD_ID_MAP[boardType],
      }}>
      <Outlet />
    </BoardContext.Provider>
  );
}
