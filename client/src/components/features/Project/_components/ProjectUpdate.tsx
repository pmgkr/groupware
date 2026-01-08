// src/components/features/Project/ProjectUpdateForm.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useUser } from '@/hooks/useUser';

import { cn } from '@/lib/utils';
import { getGrowingYears, formatAmount } from '@/utils';
import { useToggleState } from '@/hooks/useToggleState';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { getClientList } from '@/api';
import { notificationApi } from '@/api/notification';
import { getProjectInfo, projectUpdate, type ProjectViewDTO, type ProjectMemberDTO } from '@/api/project';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { SearchableSelect, type SingleSelectOption } from '@components/ui/SearchableSelect';
import { Select, SelectTriggerFull, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@components/ui/form';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { DayPicker } from '@components/daypicker';
import { MultiSelect, type MultiSelectOption } from '@/components/multiselect/multi-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { CalendarIcon, OctagonAlert } from 'lucide-react';

/* ---------------- constants ---------------- */

const categoryOptions: MultiSelectOption[] = [
  { label: 'Web', value: 'Web' },
  { label: 'Campaign', value: 'CAMPAIGN' },
  { label: 'Event Promotion', value: 'Event  Promotion' },
  { label: 'Performance', value: 'Performance' },
  { label: 'Digital Media', value: 'Digital Media' },
  { label: 'Production', value: 'Production' },
  { label: 'Others', value: 'Others' },
];

/* ---------------- schema ---------------- */

const projectUpdateSchema = z.object({
  year: z.string().min(1),
  brand: z.string().min(1),
  category: z.array(z.string()).min(1),
  client: z.string().min(1),
  project_title: z.string().min(2),
  project_sdate: z.string().nullable(),
  project_edate: z.string().nullable(),
  exp_cost: z.string().optional(),
});

type ProjectUpdateFormValues = z.infer<typeof projectUpdateSchema>;

/* ---------------- props ---------------- */

interface Props {
  open: boolean;
  projectId: string;
  projectMembers: ProjectMemberDTO[];
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

/* ---------------- component ---------------- */

function normalizePipeArray(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    return value
      .split('|')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

export function ProjectUpdate({ open, projectId, projectMembers, onOpenChange, onSuccess }: Props) {
  const { user_id, user_name, team_id, profile_image } = useUser();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [projectInfo, setProjectInfo] = useState<ProjectViewDTO | null>(null);
  const [clientOptions, setClientOptions] = useState<SingleSelectOption[]>([]);

  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : null);

  console.log(projectMembers);

  /* ---------- form ---------- */

  const form = useForm<ProjectUpdateFormValues>({
    resolver: zodResolver(projectUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      year: '',
      brand: '',
      category: [],
      client: '',
      project_title: '',
      project_sdate: null,
      project_edate: null,
      exp_cost: '',
    },
  });

  /* ---------- load clients (1회) ---------- */

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

  /* ---------- load project when open ---------- */

  useEffect(() => {
    if (!open || !projectId) return;

    (async () => {
      const res = await getProjectInfo(projectId);
      setProjectInfo(res);

      console.log('플젝 정보', res);

      form.reset({
        year: res.project_year,
        brand: res.project_brand,
        category: normalizePipeArray(res.project_cate),
        client: String(res.client_id),
        project_title: res.project_title,
        project_sdate: formatDate(new Date(res.project_sdate)) ?? null,
        project_edate: formatDate(new Date(res.project_edate)) ?? null,
        exp_cost: String(res.exp_cost ?? ''),
      });
    })();
  }, [open, projectId, form]);

  /* ---------- submit ---------- */

  const onSubmit = (v: ProjectUpdateFormValues) => {
    if (!projectInfo) return;

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
          team_id: team_id,
          client_id: Number(v.client),
          project_title: v.project_title,
          project_sdate: v.project_sdate,
          project_edate: v.project_edate,
          exp_cost: v.exp_cost || '0',
        };

        const res = await projectUpdate(projectId, payload);

        if (res.ok) {
          const notifications = projectMembers
            .filter((m) => m.user_id !== user_id) // 수정한 본인은 제외하고 알림
            .map((m) =>
              notificationApi.registerNotification({
                user_id: m.user_id,
                user_name: m.user_nm,
                noti_target: user_id!,
                noti_title: `${projectId} · ${payload.project_title}`,
                noti_message: `${user_name}님이 프로젝트 정보를 수정했습니다.`,
                noti_type: 'project',
                noti_url: `/project/${projectId}`,
              })
            );

          if (notifications.length > 0) {
            await Promise.all(notifications);
          }

          addAlert({
            title: '프로젝트 수정이 완료되었습니다.',
            icon: <OctagonAlert />,
            duration: 2000,
          });
        }

        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>프로젝트 수정</DialogTitle>
          <DialogDescription className="leading-[1.3] break-keep">프로젝트 정보를 수정할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
            <div className="grid grid-cols-2 items-start gap-4">
              {/* 생성년도 */}
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>생성년도</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="focus-visible:border-input cursor-default bg-gray-100 text-gray-600"
                        tabIndex={-1}
                        readOnly
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 브랜드 */}
              <FormField
                control={form.control}
                name="brand"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>ICG 브랜드</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTriggerFull className={cn('w-full', fieldState.invalid && 'border-destructive ring-destructive/20')}>
                          <SelectValue placeholder="브랜드 선택" />
                        </SelectTriggerFull>
                        <SelectContent>
                          <SelectItem value="PMG">PMG</SelectItem>
                          <SelectItem value="MCS">MCS</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 카테고리 */}
              <FormField
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="카테고리 선택"
                        options={categoryOptions}
                        value={field.value}
                        onValueChange={(v) => field.onChange(v)}
                        invalid={fieldState.invalid}
                        modalPopover={true}
                        maxCount={0}
                        hideSelectAll={true}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 클라이언트 */}
              <FormField
                control={form.control}
                name="client"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>클라이언트</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        placeholder="클라이언트 선택"
                        options={clientOptions}
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        invalid={fieldState.invalid}
                        className="w-full overflow-hidden"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* 프로젝트 이름 */}
            <FormField
              control={form.control}
              name="project_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="프로젝트 이름을 입력해 주세요" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 날짜 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="project_sdate"
                render={({ field }) => {
                  const { isOpen, setIsOpen, close } = useToggleState();

                  return (
                    <FormItem>
                      <FormLabel>프로젝트 시작일</FormLabel>
                      <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'border-input focus-visible:border-primary-blue-300 h-11 w-full px-3 text-left text-base font-normal text-gray-800 hover:bg-[none]',
                                !field.value && 'text-muted-foreground hover:text-muted-foreground',
                                isOpen && 'border-primary-blue-300'
                              )}>
                              {field.value ? String(field.value) : <span>날짜 선택</span>}
                              <CalendarIcon className="ml-auto size-4.5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DayPicker
                            captionLayout="label"
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              const formattedDate = date ? formatDate(date) : null;
                              field.onChange(formattedDate);

                              if (date) close();
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="project_edate"
                render={({ field }) => {
                  const { isOpen, setIsOpen, close } = useToggleState();

                  return (
                    <FormItem>
                      <FormLabel>프로젝트 종료일</FormLabel>
                      <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'border-input focus-visible:border-primary-blue-300 h-11 w-full px-3 text-left text-base font-normal text-gray-800 hover:bg-[none]',
                                !field.value && 'text-muted-foreground hover:text-muted-foreground',
                                isOpen && 'border-primary-blue-300'
                              )}>
                              {field.value ? String(field.value) : <span>날짜 선택</span>}
                              <CalendarIcon className="ml-auto size-4.5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DayPicker
                            captionLayout="label"
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              const formattedDate = date ? formatDate(date) : null;
                              field.onChange(formattedDate);

                              if (date) close();
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* 프로젝트 예상 지출 */}
            <FormField
              control={form.control}
              name="exp_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 예상 지출 금액</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="예상 지출 금액"
                      value={field.value ? formatAmount(field.value) : ''}
                      onChange={(e) => {
                        // 1. 콤마 제거
                        const raw = e.target.value.replace(/,/g, '');

                        // 2. 숫자만 허용
                        if (!/^\d*$/.test(raw)) return;

                        // 3. form에는 숫자 문자열만 저장
                        field.onChange(raw);
                      }}
                      className="text-right"
                    />
                  </FormControl>
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
