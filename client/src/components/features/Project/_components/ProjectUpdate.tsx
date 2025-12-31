// src/components/features/Project/ProjectUpdateForm.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { useToggleState } from '@/hooks/useToggleState';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { getClientList } from '@/api';
import type { projectOverview } from '@/api/project';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { SearchableSelect, type SingleSelectOption } from '@components/ui/SearchableSelect';
import { Select, SelectTriggerFull, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@components/ui/form';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { DayPicker } from '@components/daypicker';
import { MultiSelect, type MultiSelectOption } from '@/components/multiselect/multi-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

import { CalendarIcon, OctagonAlert } from 'lucide-react';

/* ---------------- schema ---------------- */

const projectUpdateSchema = z.object({
  year: z.string().min(1),
  brand: z.string().min(1),
  category: z.array(z.string()).min(1),
  client: z.string().min(1),
  project_title: z.string().min(2),
  project_sdate: z.string().nullable(),
  project_edate: z.string().nullable(),
  remark: z.string().optional(),
});

type ProjectUpdateFormValues = z.infer<typeof projectUpdateSchema>;

/* ---------------- props ---------------- */

interface Props {
  open: boolean;
  projectInfo: projectOverview['info'];
  onSuccess?: () => void;
  onOpenChange: (v: boolean) => void;
}

/* ---------------- component ---------------- */

export function ProjectUpdate({ open, projectInfo, onOpenChange, onSuccess }: Props) {
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : null);

  /* ---------- client ---------- */

  const [clientOptions, setClientOptions] = useState<SingleSelectOption[]>([]);

  useEffect(() => {
    getClientList().then((res) => {
      setClientOptions(
        res.map((c: any) => ({
          label: c.cl_name,
          value: String(c.cl_seq),
        }))
      );
    });
  }, []);

  /* ---------- form ---------- */

  const form = useForm<ProjectUpdateFormValues>({
    resolver: zodResolver(projectUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      year: projectInfo.project_year,
      brand: projectInfo.project_brand,
      category: projectInfo.project_cate,
      client: String(projectInfo.client_id),
      project_title: projectInfo.project_title,
      project_sdate: projectInfo.project_sdate,
      project_edate: projectInfo.project_edate,
      //   remark: projectInfo.remark ?? '',
    },
  });

  /* ---------- submit ---------- */

  const onSubmit = (v: ProjectUpdateFormValues) => {
    addDialog({
      title: '프로젝트 수정',
      message: `<span class="text-primary-blue-500 font-semibold">${v.project_title}</span> 프로젝트를 수정합니다.`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        const payload = {
          project_id: projectInfo.project_id,
          project_year: v.year,
          project_brand: v.brand,
          project_cate: v.category,
          client_id: Number(v.client),
          project_title: v.project_title,
          project_sdate: v.project_sdate,
          project_edate: v.project_edate,
          remark: v.remark,
        };

        // const result = await projectUpdate(payload);

        // if (result?.ok) {
        //   addAlert({
        //     title: '프로젝트 수정이 완료되었습니다.',
        //     icon: <OctagonAlert />,
        //     duration: 2000,
        //   });

        //   onSuccess?.();
        //   onClose();
        // }
      },
    });
  };

  /* ---------- UI ---------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>프로젝트 수정</DialogTitle>
          <DialogDescription className="leading-[1.3] break-keep">프로젝트 정보를 수정할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
            {/* 생성년도 */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>생성년도</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTriggerFull>
                        <SelectValue placeholder="년도 선택" />
                      </SelectTriggerFull>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit">수정</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
