import { useState } from 'react';
import VacationHistory from '@components/features/Vacation/history';
import Overview from '@components/features/Vacation/overview';

export default function ManagerVacation() {

  return (
    <div>
      <Overview />
      <VacationHistory
      />
    </div>
  );
}
