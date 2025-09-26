import { ViewGrid, ViewList } from '@/assets/images/icons';
import BlockList from '@/components/report/BlockList';
import HorizList from '@/components/report/HorizList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Report() {
  return (
    <>
      <Tabs defaultValue="block">
        <div className="flex items-center justify-between">
          <Button>새 기안서 작성</Button>
          <TabsList className="bg-white">
            <TabsTrigger
              value="block"
              className="[&]:data-[state=active]:border-primary-blue-300 p-4 px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-white [&]:data-[state=active]:text-gray-950">
              <Button variant="svgIcon" size="icon">
                <ViewGrid className="size-5" />
              </Button>
            </TabsTrigger>
            <TabsTrigger
              value="horiz"
              className="[&]:data-[state=active]:border-primary-blue-300 p-4 px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-white [&]:data-[state=active]:text-gray-950">
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
          <HorizList></HorizList>
        </TabsContent>
      </Tabs>
    </>
  );
}
