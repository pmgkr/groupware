import { useState } from 'react';
import MyVacationHistoryComponent from '@components/features/Vacation/history';
import Overview from '@components/features/Vacation/overview';

export default function ManagerVacation() {

  return (
    <div>
      <Overview />
      <MyVacationHistoryComponent
      />
    </div>
  );
}
