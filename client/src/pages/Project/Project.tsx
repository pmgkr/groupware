import { useState } from 'react';
import { cn } from '@/lib/utils';

import Overview from '@components/features/Project/ProjectOverview';
import Expense from '@components/features/Project/ProjectExpense';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Settings } from 'lucide-react';

const tabs = [
  { key: 'overview', label: '프로젝트 개요' },
  { key: 'expense', label: '프로젝트 비용' },
  { key: 'estimate', label: '견적서' },
  { key: 'invoice', label: '인보이스' },
] as const;

export default function Project() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expense' | 'estimate' | 'invoice'>('overview');

  return (
    <>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-3xl font-bold text-gray-950">
            [Dell] FY26Q3_Product Enablement (10–12) <Badge variant="secondary">진행중</Badge>
          </h2>

          <Button type="button" variant="svgIcon" className="text-gray-600">
            <Settings className="size-5" />
          </Button>
        </div>
        <nav className="mt-2 flex gap-4">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant="ghost"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative h-8 px-1 hover:bg-transparent',
                activeTab === tab.key ? 'text-primary hover:text-primary font-bold' : 'text-gray-500'
              )}>
              {tab.label} {activeTab === tab.key && <span className="bg-primary absolute right-0 bottom-0 left-0 h-[2px]" />}
            </Button>
          ))}
        </nav>
        <div className="pt-4">{activeTab === 'overview' && <Overview />}</div>
        <div className="pt-4">{activeTab === 'expense' && <Expense />}</div>
      </section>
    </>
  );
}
