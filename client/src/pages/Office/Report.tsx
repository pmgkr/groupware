import { ViewGrid, ViewList } from '@/assets/images/icons';
import BlockList from '@/components/report/BlockList';
import HorizList from '@/components/report/HorizList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';

export default function Report() {
  //브라우저 뒤로가기 tab유지
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as 'block' | 'horiz') || 'block';

  return (
    <>
      <Tabs value={tab} onValueChange={(val) => setSearchParams({ tab: val })}>
        <div className="flex items-center justify-between">
          <Button>새 기안서 작성</Button>
          <TabsList className="bg-white">
            <TabsTrigger value="block" className="px-1">
              <Button variant="svgIcon" size="icon">
                <ViewGrid className="size-5" />
              </Button>
            </TabsTrigger>
            <TabsTrigger value="horiz" className="px-1">
              <Button variant="svgIcon" size="icon">
                <ViewList className="size-5" />
              </Button>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="block">
          <BlockList></BlockList>
        </TabsContent>
        <TabsContent value="horiz">
          <HorizList tab={tab}></HorizList>
        </TabsContent>
      </Tabs>
    </>
  );
}
