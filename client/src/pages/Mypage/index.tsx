import { formatKST, formatPhone, getImageUrl, getAvatarFallback } from '@/utils';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@components/ui/SectionHeader';
import { Button } from '@components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { PlaceMin, MailMin, PhoneMin, Edit, Add, Delete, Calendar } from '@/assets/images/icons';
import { useEffect, useMemo, useState } from 'react';
import {
  deleteAccount,
  editMyProfile,
  getBankCodes,
  getMyAccounts,
  getMyProfile,
  registerAccount,
  updateAccount,
  uploadProfileImage,
  checkPassword,
  changePassword,
  type BankAccount,
  type BankCode,
  type UserDTO,
} from '@/api/mypage/profile';
import { AppPagination } from '@/components/ui/AppPagination';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { Camera, CheckCircle, Crown, CrownIcon, DeleteIcon, Loader2, OctagonAlert } from 'lucide-react';
import { CheckboxButton } from '@/components/ui/checkboxButton';
import { DayPicker } from '@components/daypicker';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';

export default function Mypage() {
  const { user: authUser, setUserState } = useAuth();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserDTO | null>(null);
  const [isBirthOpen, setIsBirthOpen] = useState(false);
  const [isHireOpen, setIsHireOpen] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  // 비밀번호 변경 모달 상태
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [passwordChangeStep, setPasswordChangeStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();
        //console.log('/user/profile 응답:', data);
        setUser(data);
        setEditedUser(data);
      } catch (err) {
        console.error('❌ 사용자 정보 불러오기 실패:', err);
      }
    })();
  }, []);

  const REQUIRED_FIELDS: {
    key: keyof NonNullable<typeof editedUser>;
    label: string;
  }[] = [
      { key: 'phone', label: '휴대폰 번호' },
      { key: 'birth_date', label: '생년월일' },
      { key: 'hire_date', label: '입사일' },
      { key: 'address', label: '주소' },
    ];
  //프로필 수정 저장
  const handleEditSave = async () => {
    if (!editedUser) return;
    if (hasEmptyRequiredField()) return;

    // 날짜 변환 함수
    const formatDate = (value?: string | null) => {
      if (!value) return '';
      // ISO 문자열인 경우만 처리
      if (value.includes('T')) return value.split('T')[0];
      // "2025-10-10 00:00:00" 같은 경우
      if (value.includes(' ')) return value.split(' ')[0];
      return value;
    };
    try {
      await editMyProfile({
        birth_date: formatDate(editedUser.birth_date),
        hire_date: formatDate(editedUser.hire_date),
        address: editedUser.address || '',
        emergency_phone: editedUser.emergency_phone || '',
        phone: editedUser.phone || '',
      });

      addAlert({
        title: '프로필 수정',
        message: `<p>프로필이 수정되었습니다.</p>`,
        icon: <CheckCircle />,
        duration: 2000,
      });

      setUser(editedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('❌ 프로필 수정 실패:', err);
      addAlert({
        title: '프로필 수정 오류',
        message: `<p>프로필이 수정에 실패하였습니다.</p>`,
        icon: <CheckCircle />,
        duration: 2000,
      });
    }
  };
  // 프로필 수정 취소
  const handleCancel = () => {
    setEditedUser(user); // 원래 값 복원
    setIsEditing(false);
  };

  const handleEditStart = () => {
    setEditedUser({
      ...user!,
      phone: user?.phone?.replace(/\D/g, '') || '',
    });
  };
  const hasEmptyRequiredField = () => {
    if (!editedUser) return false;

    for (const field of REQUIRED_FIELDS) {
      const value = editedUser[field.key];

      if (!value || String(value).trim() === '') {
        addAlert({
          title: '필수 입력 항목',
          message: `<p><strong>${field.label}</strong>을(를) 입력해주세요.</p>`,
          icon: <OctagonAlert className="text-red-500" />,
          duration: 2500,
        });
        return true;
      }
    }

    return false;
  };

  //프로필 이미지 수정
  const profileImageUrl = useMemo(() => {
    if (!user?.profile_image) return null;

    /* if (!user?.profile_image) {
      return getImageUrl('dummy/set_img');
    } */

    // 🔥 Cloud URL인 경우 (http로 시작)
    if (user.profile_image.startsWith('http')) {
      return `${user.profile_image}?t=${Date.now()}`;
    }

    // 🔥 기존 DB 파일명인 경우
    return `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${user.profile_image}?t=${Date.now()}`;
  }, [user?.profile_image]);

  const avatarFallback = useMemo(() => {
    return getAvatarFallback(user?.user_id || '');
  }, [user?.user_id]);

  const handleProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addAlert({
        title: '파일 크기 초과',
        message: `<p>이미지 파일은 5MB 이하로 업로드해주세요.</p>`,
        icon: <OctagonAlert className="text-red-500" />,
        duration: 2500,
      });
      return;
    }
    setIsUploadingProfile(true);

    try {
      const result = await uploadProfileImage(file, 'mypage');
      console.log('📸 업로드 결과:', result);

      const updatedUser = await getMyProfile();
      setUser(updatedUser);

      // AuthContext의 전역 상태도 업데이트
      if (authUser) {
        setUserState({ ...authUser, profile_image: updatedUser.profile_image });
      }
      // 이벤트 발생 (다른 컴포넌트에 알림용)
      window.dispatchEvent(new Event('profile_update'));

      // localStorage는 즉시 삭제 (플래그로만 사용)
      localStorage.setItem('profile_update', Date.now().toString());
      setTimeout(() => localStorage.removeItem('profile_update'), 100);

      console.log('📸 업로드 성공:', result);

      addAlert({
        title: '프로필 이미지 변경',
        message: `<p>프로필 이미지가 성공적으로 변경되었습니다.</p>`,
        icon: <CheckCircle className="text-green-500" />,
        duration: 2000,
      });
    } catch (err) {
      console.error('❌ 프로필 이미지 업로드 실패:', err);
      addAlert({
        title: '오류',
        message: `<p>이미지 업로드 중 오류가 발생했습니다.</p>`,
        icon: <OctagonAlert className="text-red-500" />,
        duration: 2500,
      });
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyAccounts();

        // 전체 데이터 정렬 (mine 먼저, 그다음 최신순)
        const sorted = [...data].sort((a, b) => {
          if (a.flag === 'mine' && b.flag !== 'mine') return -1;
          if (b.flag === 'mine' && a.flag !== 'mine') return 1;
          return new Date(b.wdate).getTime() - new Date(a.wdate).getTime();
        });
        setTotalPages(Math.ceil(sorted.length / pageSize));

        //현재 페이지에 해당하는 데이터만 잘라서 표시
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setAccounts(sorted.slice(startIndex, endIndex));
      } catch (err) {
        console.error('❌ 계좌 목록 불러오기 실패:', err);
        setAccounts([]);
      }
    })();
  }, [page]);

  const accountSchema = z.object({
    flag: z.enum(['mine', 'exp']).default('exp').optional(),
    account_alias: z.string().min(1, '계좌 별명을 입력해주세요.'),
    bank_name: z.string().min(1, '은행명을 선택해주세요.'),
    bank_account: z.string().min(1, '계좌번호를 입력해주세요.'),
    account_name: z.string().min(1, '예금주를 입력해주세요.'),
  });
  type AccountFormData = z.infer<typeof accountSchema>;
  const [open, setOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [bankCodes, setBankCodes] = useState<BankCode[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await getBankCodes();

        setBankCodes(data);
      } catch (err) {
        console.error('❌ 은행 코드 목록 불러오기 실패:', err);
      }
    })();
  }, []);
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      flag: 'exp',
      account_alias: '',
      bank_name: '',
      bank_account: '',
      account_name: '',
    },
  });

  useEffect(() => {
    if (open && editAccount && bankCodes.length > 0) {
      // ⭐ bank_name으로 bank_code 역으로 찾기
      const foundBank = bankCodes.find((b) => b.name === editAccount.bank_name);

      if (!foundBank) {
        console.warn('⚠️ 은행을 찾을 수 없습니다:', editAccount.bank_name);
      }

      form.reset({
        flag: editAccount.flag as 'mine' | 'exp',
        account_alias: editAccount.account_alias,
        bank_name: foundBank?.code || '', // code를 사용
        bank_account: editAccount.bank_account,
        account_name: editAccount.account_name,
      });
    } else if (open && !editAccount) {
      form.reset({
        account_alias: '',
        bank_name: '',
        bank_account: '',
        account_name: '',
      });
    }
  }, [open, editAccount, bankCodes, form]);

  const onSubmit = async (data: AccountFormData) => {
    try {
      const selectedBank = bankCodes.find((b) => b.code === data.bank_name); // code → name 매핑
      const dto = {
        flag: data.flag || 'exp',
        account_alias: data.account_alias,
        bank_code: data.bank_name,
        bank_name: selectedBank?.name || '', // name optional
        bank_account: data.bank_account,
        account_name: data.account_name,
      };

      if (editAccount) {
        //수정
        await updateAccount(editAccount.seq, dto);
        addAlert({
          title: '계좌 수정',
          message: `<p><strong>${dto.account_alias}</strong> 계좌가 수정되었습니다.</p>`,
          icon: <CheckCircle className="text-green-500" />,
          duration: 2000,
        });
      } else {
        //등록
        await registerAccount(dto);
        addAlert({
          title: '계좌 등록',
          message: `<p><strong>${dto.account_alias}</strong> 계좌가 등록되었습니다.</p>`,
          icon: <CheckCircle className="text-green-500" />,
          duration: 2000,
        });
      }
      //console.log('✅ 계좌 등록 성공:', data);

      //닫기 및 초기화
      setOpen(false);
      setEditAccount(null);
      form.reset();
      //리스트 갱신
      const updated = await getMyAccounts();
      setAccounts(updated.slice(0, pageSize));
      setTotalPages(Math.ceil(updated.length / pageSize));
    } catch (err) {
      console.error('❌ 계좌 등록/수정 실패:', err);
      addAlert({
        title: '오류',
        message: `<p>계좌 처리 중 오류가 발생했습니다.</p>`,
        icon: <OctagonAlert className="text-red-500" />,
        duration: 3000,
      });
    }
  };

  //계좌 삭제
  const handleDeleteAccount = async (seq: number) => {
    try {
      await deleteAccount(seq);
      const updated = await getMyAccounts();
      setAccounts(updated.slice(0, pageSize));
      setTotalPages(Math.ceil(updated.length / pageSize));
    } catch (err) {
      console.error('❌ 계좌 삭제 실패:', err);
      alert('계좌 삭제 중 오류가 발생했습니다.');
    }
  };

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  if (!user) {
    return (
      <section className="flex items-center justify-center py-20">
        <Loader2 className="text-primary-blue-500 size-8 animate-spin" />
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-y-5">
        <div className="flex items-center gap-x-7 rounded-md border border-gray-300 px-5 py-[31px] sm:px-8 md:gap-x-10 md:px-14 md:py-6 lg:gap-x-14 lg:px-10 xl:px-20">
          <div className="group relative aspect-square w-[90px] shrink-0 overflow-hidden rounded-[50%] md:w-25 lg:w-36">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="프로필 이미지" className="h-full w-full object-cover" />
            ) : (
              <div className="bg-primary-blue-100 flex h-full w-full items-center justify-center text-4xl font-bold text-black">
                {avatarFallback}
              </div>
            )}
            {/* hover 오버레이 - 업로드 중이 아닐 때만 표시 */}
            {!isUploadingProfile && (
              <label
                htmlFor="profileUpload"
                className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Camera className="size-10 text-white/80" />
              </label>
            )}

            {/* 업로드 중 오버레이 - 항상 표시 */}
            {isUploadingProfile && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
                <Loader2 className="size-10 animate-spin text-white" />
                <p className="mt-2 text-sm text-white">업로드 중...</p>
              </div>
            )}

            <input
              id="profileUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImage}
              disabled={isUploadingProfile} // 🔥 업로드 중 입력 비활성화
            />
          </div>

          <div className="text-base font-medium tracking-tight text-gray-950">
            <div className="flex items-center gap-x-1.5 text-[.875em] text-gray-500 max-md:text-sm">
              {user?.branch}
              <PlaceMin className="inline-block size-3.5" />
            </div>
            <div className="mt-2.5 mb-1 max-md:mt-2 max-md:mb-2 max-md:text-sm">
              <strong className="block text-[1.5em] font-bold max-md:text-[18px]">{user?.user_name_en}</strong>
              {user?.job_role}
            </div>
            <ul className="flex h-[32px] flex-col items-start gap-x-4 text-sm text-[.875em] font-normal max-md:h-auto sm:flex-row sm:items-center">
              <li className="flex flex-1 items-center gap-x-1.5 max-md:mb-[3px]">
                <MailMin className="size-5" />
                <span>{user?.user_id}</span>
              </li>
              <li className="flex flex-1 items-center gap-x-1.5">
                <PhoneMin className="size-5 shrink-0" />
                {isEditing ? (
                  <Input
                    className="h-8 text-sm"
                    value={editedUser?.phone || ''}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => {
                      const onlyNumber = e.target.value.replace(/\D/g, '');
                      setEditedUser({ ...editedUser!, phone: onlyNumber });
                    }}
                  />
                ) : (
                  <>
                    <span className="inline-block w-[110px]">{formatPhone(user?.phone)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-[24px] px-2 text-xs text-primary-blue-500"
                      onClick={() => {
                        setIsPasswordChangeOpen(true);
                        setPasswordChangeStep(1);
                        setCurrentPassword('');
                        setNewPassword('');
                        setNewPasswordConfirm('');
                      }}
                    >
                      비밀번호변경
                    </Button>
                  </>
                )}
              </li>
            </ul>
          </div>
        </div>
        <div className="rounded-md border border-gray-300 px-5 py-8 max-md:py-7 md:py-12.5 lg:px-10 xl:px-18.5">
          <div className="mb-5 flex items-center justify-between border-b border-b-gray-300 pb-1.5 md:mb-6">
            <SectionHeader title="프로필 수정" className="mb-0 border-0" />
            <div className="flex gap-x-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleEditSave}>
                    수정완료
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="text-primary-blue-500">
                  <Edit className="mr-1 size-4" />
                  수정
                </Button>
              )}
            </div>
          </div>

          <div className="mb-15 grid grid-cols-1 gap-y-3.5 tracking-tight md:grid-cols-3 md:gap-y-6">
            <div className="order-1 text-sm leading-[1.5] text-gray-700 md:pr-5 lg:text-base">
              <strong className="inline-block w-[78px] text-[1.14em] font-bold text-gray-950 md:mb-1 md:block">팀 이름</strong>
              <span>{user?.team_name}</span>
            </div>
            <div className="relative order-3 text-sm leading-[1.5] text-gray-700 md:order-2 md:px-5 lg:text-base">
              <div className="short-v-divider absolute top-0 left-0 hidden h-[90%] w-[1px] bg-gray-300 md:block" />
              <div className="flex items-center md:flex-col md:items-start">
                <strong className="inline-block w-[78px] shrink-0 text-[1.14em] font-bold text-gray-950 md:mb-1 md:block">생년월일</strong>
                {isEditing ? (
                  <Popover open={isBirthOpen} onOpenChange={setIsBirthOpen}>
                    <div className="relative w-full">
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'border-input focus-visible:border-primary-blue-300 h-10 w-full px-3 text-left text-base font-normal text-gray-700 hover:bg-[none]',
                            !editedUser?.birth_date && 'text-muted-foreground hover:text-muted-foreground',
                            isBirthOpen && 'border-primary-blue-300'
                          )}>
                          {editedUser?.birth_date ? String(formatKST(editedUser.birth_date, true)) : <span>YYYY-MM-DD</span>}
                          <Calendar className="ml-auto size-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                    </div>

                    <PopoverContent className="w-auto p-0" align="start">
                      <DayPicker
                        captionLayout="dropdown"
                        mode="single"
                        selected={editedUser?.birth_date ? new Date(editedUser.birth_date) : undefined}
                        onSelect={(date) => {
                          const formatted = date ? formatKST(date) : '';
                          setEditedUser({ ...editedUser!, birth_date: formatted });
                          if (date) setIsBirthOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span className="block">{formatKST(user?.birth_date, true)}</span>
                )}
              </div>
            </div>
            <div className="relative order-4 text-sm leading-[1.5] text-gray-700 md:order-3 md:px-5 lg:text-base">
              <div className="short-v-divider absolute top-0 left-0 hidden h-[90%] w-[1px] bg-gray-300 md:block" />
              <div className="flex items-center md:flex-col md:items-start">
                <strong className="inline-block w-[78px] shrink-0 text-[1.14em] font-bold text-gray-950 md:mb-1 md:block">입사일</strong>
                {isEditing ? (
                  <Popover open={isHireOpen} onOpenChange={setIsHireOpen}>
                    <div className="relative w-full">
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'border-input focus-visible:border-primary-blue-300 h-10 w-full px-3 text-left text-base font-normal text-gray-700 hover:bg-[none]',
                            !editedUser?.birth_date && 'text-muted-foreground hover:text-muted-foreground',
                            isHireOpen && 'border-primary-blue-300'
                          )}>
                          {editedUser?.birth_date ? String(formatKST(editedUser.hire_date, true)) : <span>YYYY-MM-DD</span>}
                          <Calendar className="ml-auto size-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                    </div>

                    <PopoverContent className="w-auto p-0" align="start">
                      <DayPicker
                        captionLayout="dropdown"
                        mode="single"
                        selected={editedUser?.hire_date ? new Date(editedUser.hire_date) : undefined}
                        onSelect={(date) => {
                          const formatted = date ? formatKST(date) : '';
                          setEditedUser({ ...editedUser!, hire_date: formatted });
                          if (date) setIsHireOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span className="block">{formatKST(user?.hire_date, true)}</span>
                )}
              </div>
            </div>

            <div className="order-2 text-sm leading-[1.5] text-gray-700 md:order-4 md:pr-5 lg:text-base">
              <strong className="inline-block w-[78px] text-[1.14em] font-bold text-gray-950 md:mb-1 md:block">회원 레벨</strong>
              <span>
                <Badge>{user?.user_level}</Badge>
              </span>
            </div>
            <div className="relative order-5 text-sm leading-[1.5] text-gray-700 md:col-span-1 md:block md:px-5 lg:text-base">
              <div className="short-v-divider absolute top-0 left-0 hidden h-[90%] w-[1px] bg-gray-300 md:block" />

              <div className="flex items-center md:flex-col md:items-start">
                <strong className="inline-block w-[78px] shrink-0 text-[1.14em] font-bold text-gray-950 md:mb-1 md:block">주소</strong>
                {isEditing ? (
                  <Input
                    className="h-10"
                    value={editedUser?.address || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, address: e.target.value })}
                  />
                ) : (
                  <span className="block">{user?.address}</span>
                )}
              </div>
            </div>
            <div className="relative order-6 text-sm leading-[1.5] text-gray-700 md:col-span-1 md:px-5 lg:text-base">
              <div className="short-v-divider absolute top-0 left-0 hidden h-[90%] w-[1px] bg-gray-300 md:block" />
              <div className="flex items-center md:flex-col md:items-start">
                <strong className="inline-block w-[78px] shrink-0 text-[1.14em] font-bold text-gray-950 md:mb-1 md:block">
                  비상 연락망
                </strong>
                {isEditing ? (
                  <Input
                    className="h-10"
                    value={editedUser?.emergency_phone || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, emergency_phone: e.target.value })}
                  />
                ) : (
                  <span className="block">{user?.emergency_phone}</span>
                )}
              </div>
            </div>
          </div>

          <Dialog
            open={isPasswordChangeOpen}
            onOpenChange={(isOpen) => {
              setIsPasswordChangeOpen(isOpen);
              if (!isOpen) {
                setPasswordChangeStep(1);
                setCurrentPassword('');
                setNewPassword('');
                setNewPasswordConfirm('');
              }
            }}>
            <DialogContent className="w-[400px] gap-y-6 px-4 max-md:max-w-[calc(100%-var(--spacing)*8)] max-md:rounded-md lg:px-6">
              <DialogHeader>
                <DialogTitle>비밀번호 변경</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {passwordChangeStep === 1 && (
                  <div>
                    <Label className="mb-2 block">현재 비밀번호</Label>
                    <Input
                      type="password"
                      placeholder="현재 비밀번호를 입력해주세요"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                )}
                {passwordChangeStep === 2 && (
                  <>
                    <div>
                      <Label className="mb-2 block">새 비밀번호</Label>
                      <Input
                        type="password"
                        placeholder="새 비밀번호를 입력해주세요"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">새 비밀번호 확인</Label>
                      <Input
                        type="password"
                        placeholder="새 비밀번호를 다시 입력해주세요"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="pt-8 max-sm:flex-row max-sm:justify-center max-sm:gap-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordChangeOpen(false)}
                  className="max-sm:flex-1">
                  취소
                </Button>
                {passwordChangeStep === 1 ? (
                  <Button
                    type="button"
                    className="max-sm:flex-1"
                    onClick={async () => {
                      if (!currentPassword) {
                        addAlert({
                          title: '알림',
                          message: '<p>현재 비밀번호를 입력해주세요.</p>',
                          icon: <OctagonAlert className="text-red-500" />,
                          duration: 2000,
                        });
                        return;
                      }
                      try {
                        const res = await checkPassword(currentPassword);
                        if (res.isMatch) {
                          setPasswordChangeStep(2);
                        } else {
                          addAlert({
                            title: '오류',
                            message: '<p>비밀번호가 일치하지 않습니다.</p>',
                            icon: <OctagonAlert className="text-red-500" />,
                            duration: 2000,
                          });
                        }
                      } catch (err) {
                        console.error('Password check failed:', err);
                        addAlert({
                          title: '오류',
                          message: '<p>비밀번호 확인 중 오류가 발생했습니다.</p>',
                          icon: <OctagonAlert className="text-red-500" />,
                          duration: 2000,
                        });
                      }
                    }}>
                    확인
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="max-sm:flex-1"
                    onClick={async () => {
                      if (!newPassword || !newPasswordConfirm) {
                        addAlert({
                          title: '알림',
                          message: '<p>새 비밀번호를 입력해주세요.</p>',
                          icon: <OctagonAlert className="text-red-500" />,
                          duration: 2000,
                        });
                        return;
                      }
                      if (newPassword !== newPasswordConfirm) {
                        addAlert({
                          title: '오류',
                          message: '<p>새 비밀번호가 일치하지 않습니다.</p>',
                          icon: <OctagonAlert className="text-red-500" />,
                          duration: 2000,
                        });
                        return;
                      }
                      try {
                        await changePassword(newPassword);
                        addAlert({
                          title: '완료',
                          message: '<p>비밀번호가 변경되었습니다.</p>',
                          icon: <CheckCircle className="text-green-500" />,
                          duration: 2000,
                        });
                        setIsPasswordChangeOpen(false);
                      } catch (err) {
                        console.error('Password change failed:', err);
                        addAlert({
                          title: '오류',
                          message: '<p>비밀번호 변경 중 오류가 발생했습니다.</p>',
                          icon: <OctagonAlert className="text-red-500" />,
                          duration: 2000,
                        });
                      }
                    }}>
                    변경
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setEditAccount(null);
                form.reset();
              }
            }}>
            <div className="mb-6 flex items-center justify-between border-b border-b-gray-300 pb-1.5 max-md:mb-1.5">
              <SectionHeader title="은행계좌 목록" className="mb-0 border-0" />
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary-blue-500"
                  onClick={() => {
                    setEditAccount(null);
                    form.reset();
                  }}>
                  <Add className="size-4" />
                  계좌 추가
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="w-full gap-y-6 px-4 max-md:max-w-[calc(100%-var(--spacing)*8)] max-md:rounded-md lg:px-6">
              <DialogHeader>
                <DialogTitle>{editAccount ? '은행계좌 수정' : '은행계좌 추가'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex items-end gap-x-3">
                    <FormField
                      control={form.control}
                      name="account_alias"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center justify-between">
                            <FormLabel className="leading-5">계좌 별명</FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Input placeholder="계좌 별명을 입력해주세요" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center justify-between">
                            <FormLabel className="leading-5">은행명</FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="은행을 선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                {bankCodes.map((bank) => (
                                  <SelectItem key={bank.code} value={bank.code}>
                                    {bank.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-end gap-x-3">
                    <FormField
                      control={form.control}
                      name="bank_account"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center justify-between">
                            <FormLabel className="leading-5">계좌번호</FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Input
                              placeholder="계좌번호를 입력하세요"
                              {...field}
                              onChange={(e) => {
                                // 숫자(0-9)와 하이픈(-)만 허용
                                const filtered = e.target.value.replace(/[^0-9-]/g, '');
                                field.onChange(filtered);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="account_name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center justify-between">
                            <FormLabel className="leading-5">예금주</FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Input placeholder="예금주 명을 입력하세요" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center">
                    <FormField
                      control={form.control}
                      name="flag"
                      render={({ field }) => (
                        <FormItem>
                          <Checkbox
                            id="flag"
                            label="대표 설정"
                            size="md"
                            checked={field.value === 'mine'} // ✅ 체크 상태 → mine
                            onCheckedChange={(checked) => field.onChange(checked ? 'mine' : 'exp')}
                          />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="pt-8 max-sm:flex-row max-sm:justify-center max-sm:gap-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        form.reset();
                      }}
                      className="max-sm:flex-1">
                      취소
                    </Button>
                    <Button type="submit" className="max-sm:flex-1">
                      {editAccount ? '수정' : '확인'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <div>
            <Table className="mb-6 w-full table-fixed">
              <TableHeader>
                <TableRow className="text-sm md:text-base max-md:[&>th]:h-9 max-md:[&>th]:p-0">
                  <TableHead className="w-[25px] pr-0 md:w-[5%]"></TableHead>
                  <TableHead className="w-[75px] md:w-[16%]">계좌 별명</TableHead>
                  <TableHead className="w-[65px] md:w-[15%]">은행명</TableHead>
                  <TableHead className="w-[95px]">계좌 번호</TableHead>
                  <TableHead className="w-[70px] md:w-[15%]">예금주</TableHead>
                  <TableHead className="w-[120px] md:w-[18%]">등록일시</TableHead>
                  <TableHead className="w-[90px] md:w-[12%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-sm md:text-base">
                {accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <TableRow key={acc.seq} className="max-md:[&>td]:h-9 max-md:[&>td]:p-0">
                      <TableCell className="w-[30px] pr-0 max-md:pl-0">
                        {acc.flag === 'mine' && <CrownIcon className="inline-block size-4 text-yellow-500 md:size-5" />}
                      </TableCell>
                      <TableCell className="w-[75px] truncate">{acc.account_alias}</TableCell>
                      <TableCell className="w-[65px] truncate">{acc.bank_name}</TableCell>
                      <TableCell>{acc.bank_account}</TableCell>
                      <TableCell>{acc.account_name}</TableCell>
                      <TableCell className="w-[120px] truncate">{formatKST(acc.wdate)}</TableCell>
                      {/* 수정 삭제 버튼 */}
                      <TableCell>
                        <Button
                          variant="svgIcon"
                          size="icon"
                          onClick={() => {
                            setEditAccount(acc);
                            setOpen(true);
                          }}>
                          <Edit className="size-4 max-md:size-3.5" />
                        </Button>

                        <Button
                          variant="svgIcon"
                          size="icon"
                          onClick={() =>
                            addDialog({
                              title: '<span class="font-semibold"> 계좌 삭제</span>',
                              message: `${acc.account_alias} 계좌를 삭제하시겠습니까?`,
                              confirmText: '삭제',
                              cancelText: '취소',
                              onConfirm: () => {
                                (handleDeleteAccount(acc.seq),
                                  addAlert({
                                    title: '계좌 삭제',
                                    message: `<p>삭제가 완료되었습니다.</p>`,
                                    icon: <DeleteIcon />,
                                    duration: 2000,
                                  }));
                              },
                            })
                          }>
                          <Delete className="size-4 max-md:size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                      등록된 계좌가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {accounts.length > 0 && (
              <div className="mt-5">
                <AppPagination totalPages={totalPages} initialPage={page} visibleCount={5} onPageChange={(newPage) => setPage(newPage)} />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
