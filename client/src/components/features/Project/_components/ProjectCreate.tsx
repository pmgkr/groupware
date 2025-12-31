import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { getAvatarFallback, getProfileImageUrl } from '@/utils';
import { useToggleState } from '@/hooks/useToggleState';
import { useUser } from '@/hooks/useUser';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { MemberSelect, type Member } from '@components/common/MemberSelect';

import { getClientList, projectCreate } from '@/api';
import { notificationApi } from '@/api/notification';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { Textarea } from '@components/ui/textarea';
import { SearchableSelect, type SingleSelectOption } from '@components/ui/SearchableSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Select, SelectTriggerFull, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { DayPicker } from '@components/daypicker';
import { format } from 'date-fns';

import { CalendarIcon, Plus, OctagonAlert } from 'lucide-react';
import { MultiSelect, type MultiSelectOption } from '@/components/multiselect/multi-select';

const projectSchema = z.object({
  year: z.string().min(1, '생성년도를 선택하세요.'),
  brand: z.string().min(1, 'ICG 브랜드를 선택하세요.'),
  category: z.array(z.string()).min(1, '카테고리를 선택하세요.'),
  client: z.string().min(1, '클라이언트를 선택하세요.'),
  project_title: z.string().min(2, '프로젝트 이름을 입력하세요.'),
  members: z.array(z.string()).min(1, '멤버를 선택하세요.'),
  project_sdate: z.string().nullable(),
  project_edate: z.string().nullable(),
  remark: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
};

export function ProjectCreateForm({ onClose, onSuccess }: Props) {
  // Alert & Dialog hooks
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const { user_id, user_name, profile_image } = useUser();
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  // API 데이터 State
  const [clientOptions, setClientOptions] = useState<SingleSelectOption[]>([]);

  const form = useForm<ProjectFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(projectSchema),
    defaultValues: {
      year: '2026',
      brand: '',
      category: [],
      client: '',
      project_title: '',
      members: [],
      remark: '',
    },
  });

  const categoryOptions: MultiSelectOption[] = [
    { label: 'Web', value: 'Web' },
    { label: 'Campaign', value: 'Campaign' },
    { label: 'Event Promotion', value: 'Event  Promotion' },
    { label: 'Performance', value: 'Performance' },
    { label: 'Digital Media', value: 'Digital Media' },
    { label: 'Production', value: 'Production' },
    { label: 'Others', value: 'Others' },
  ];

  const fetchClients = useCallback(async () => {
    try {
      const res = await getClientList();
      const mapped = res.map((t: any) => ({
        label: t.cl_name,
        value: String(t.cl_seq),
      }));
      setClientOptions(mapped);
    } catch (err) {
      console.error('❌ 클라이언트 불러오기 오류 :', err);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // 멤버에 접속중인 ID 기본값 설정
  const getDefaultMembers = useCallback((): Member[] => {
    if (!user_id || !user_name) return [];
    return [
      {
        user_id,
        user_name,
        profile_image: profile_image ?? undefined,
        user_type: 'owner',
      },
    ];
  }, [user_id, user_name, profile_image]);

  const [members, setMembers] = useState<Member[]>(getDefaultMembers);

  useEffect(() => {
    form.setValue(
      'members',
      members.map((m) => m.user_id)
    ); // string[]만 저장
  }, [members, form]);

  const handleCancel = () => {
    // Dialog 하위 취소 버튼 클릭 시 폼 리셋 & 멤버 선택 초기화
    form.reset();
    setMembers(getDefaultMembers());
    onClose?.();
  };

  // 프로젝트 생성 시 알림 발송 함수
  const sendProjectCreateNotifications = async ({
    projectId,
    projectTitle,
    owner,
    members,
  }: {
    projectId: string;
    projectTitle: string;
    owner: { user_id: string; user_name: string };
    members: Member[];
  }) => {
    const notifications = [];

    // 프로젝트 오너 알림
    notifications.push(
      notificationApi.registerNotification({
        user_id: owner.user_id,
        user_name: owner.user_name,
        noti_target: owner.user_id,
        noti_title: projectTitle,
        noti_message: '프로젝트 생성이 완료되었습니다.',
        noti_type: 'project',
        noti_url: `/project/${projectId}`,
      })
    );

    // 프로젝트 멤버 알림 (오너 제외)
    members
      .filter((m) => m.user_id !== owner.user_id)
      .forEach((m) => {
        notifications.push(
          notificationApi.registerNotification({
            user_id: m.user_id, // 보낸 사람 = 생성자
            user_name: m.user_name,
            noti_target: owner.user_id,
            noti_title: projectTitle,
            noti_message: `${owner.user_name}님의 프로젝트에 초대되었습니다.`,
            noti_type: 'project',
            noti_url: `/project/${projectId}`,
          })
        );
      });

    await Promise.all(notifications);
  };

  const onSubmit = (v: ProjectFormValues) => {
    addDialog({
      title: '프로젝트를 생성하시겠습니까?',
      message: `<span class="text-primary-blue-500 font-semibold">${v.project_title}</span> 프로젝트를 생성합니다.`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        const payload = {
          project_year: v.year,
          project_brand: v.brand,
          project_cate: v.category,
          client_id: Number(v.client),
          project_title: v.project_title,
          members: members.map((m) => ({
            user_id: m.user_id,
            user_nm: m.user_name,
            user_type: m.user_type,
          })),
          project_sdate: v.project_sdate,
          project_edate: v.project_edate,
          remark: v.remark,
        };

        const result = await projectCreate(payload);

        console.log('✅ 등록 성공:', result);
        if (result.ok) {
          try {
            await sendProjectCreateNotifications({
              projectId: result.project_id,
              projectTitle: v.project_title,
              owner: {
                user_id: user_id!,
                user_name: user_name!,
              },
              members,
            });
          } catch (e) {
            console.error('🔔 알림 전송 실패:', e);
          }

          addAlert({
            title: '프로젝트 생성이 완료되었습니다.',
            message: `<p>프로젝트 아이디 <span class="text-primary-blue-500">${result.project_id}</span>로 생성되었습니다.</p>`,
            icon: <OctagonAlert />,
            duration: 2000,
          });

          onSuccess?.();
        }
      },
    });
  };

  const onError = (errors: any) => {
    console.error('폼 검증 에러:', errors);
  };

  return (
    <Form {...form}>
      <Dialog>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-5 pt-4">
          <div className="grid grid-cols-2 items-start gap-4">
            {/* 생성년도 */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>생성년도</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTriggerFull className="w-full">
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

            {/* 브랜드 */}
            <FormField
              control={form.control}
              name="brand"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>ICG 브랜드</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>비고</FormLabel>
                  <FormControl>
                    <Textarea placeholder="추가 기입할 정보가 있으면 입력해 주세요." className="h-16 min-h-16" {...field} />
                  </FormControl>
                </FormItem>
              );
            }}
          />

          {/* 프로젝트 멤버 */}
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>프로젝트 멤버</FormLabel>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="xs" className="text-primary-blue-500 hover:text-primary-blue-500">
                  <Plus className="size-3.5" />
                  멤버 추가
                </Button>
              </DialogTrigger>
            </div>
            <div className="border-input flex flex-wrap gap-2">
              {members.map((m) => (
                <Badge key={m.user_id} variant="grayish" className="flex items-center gap-1 px-1.5 py-1 not-has-[>button]:px-2">
                  <Avatar className="size-5">
                    <AvatarImage src={getProfileImageUrl(m.profile_image)} />
                    <AvatarFallback className="text-xs">{getAvatarFallback(m.user_id)}</AvatarFallback>
                  </Avatar>
                  {m.user_name}
                  {user_id !== m.user_id && (
                    <button
                      type="button"
                      className="ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id))}>
                      ✕
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </FormItem>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button type="submit">등록</Button>
          </div>
        </form>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 선택</DialogTitle>
          </DialogHeader>

          <MemberSelect
            value={members}
            onChange={(selected) =>
              setMembers((prev) => {
                const owner = prev.find((m) => m.user_type === 'owner');
                const unique = selected.filter((m) => m.user_id !== owner?.user_id);
                return owner ? [owner, ...unique] : unique;
              })
            }
            currentUserId={user_id}
          />

          <ul className="mt-2 flex flex-wrap items-center gap-2">
            {members.map((m) => (
              <li key={m.user_id}>
                <Badge key={m.user_id} variant="grayish" className="flex items-center gap-1 px-1.5 py-1 not-has-[>button]:px-2">
                  <Avatar className="size-5">
                    <AvatarImage src={getProfileImageUrl(m.profile_image)} />
                    <AvatarFallback className="text-xs">{getAvatarFallback(m.user_id)}</AvatarFallback>
                  </Avatar>
                  {m.user_name}
                  {user_id !== m.user_id && (
                    <button
                      type="button"
                      className="ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id))}>
                      ✕
                    </button>
                  )}
                </Badge>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <DialogClose asChild>
              <Button type="button">확인</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
