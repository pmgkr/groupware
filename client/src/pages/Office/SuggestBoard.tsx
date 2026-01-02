import { Outlet } from 'react-router';

export default function SuggestBoard() {
  return (
    <>
      <Outlet context={{ boardId: 2 }} />
    </>
  );
}
