// src/features/profile/ProfileForm.tsx
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileSchema, type ProfileValues } from './ProfileSchema';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { onboardingApi, initFormApi, onboardingUploadApi } from '@/api';
import { getTeams, type TeamDto } from '@/api/teams';
import { setToken as setTokenStore } from '@/lib/tokenStore';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { DayPicker } from '@components/daypicker';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from '@components/ui/select';
import { format } from 'date-fns';
import { Calendar, Upload } from '@/assets/images/icons';

type ProfileFormProps = {
  email: string; // 로그인 409 응답에서 받은 email
  onboardingToken: string; // 로그인 409 응답에서 받은 onboardingToken
  profileImage?: string | null; // 업로드된 이미지 경로
  className?: string;
};

export default function ProfileForm({ email, onboardingToken, profileImage, className }: ProfileFormProps) {
  const navigate = useNavigate();

  const [uinfo, setUinfo] = useState<any>(null); // 초기 데이터 저장용



  const [dobOpen, setDobOpen] = useState(false); // 생년월일 팝오버용
  const [hireOpen, setHireOpen] = useState(false); // 입사일 팝오버용
  const [submitting, setSubmitting] = useState(false);

  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);

  // 이미지 업로드 관련 상태
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      user_id: email,
      user_pw: '', // 비밀번호 초기값
      user_name: '',
      user_name_en: '',
      phone: '',
      job_role: '',
      birth_date: undefined as Date | undefined,
      hire_date: undefined as Date | undefined,
      address: '',
      emergency_phone: '',
      team_id: undefined,
      profile_image: '',
    },
    mode: 'onChange',
  });

  const { setFocus } = form;

  // 토큰 검증 및 초기 데이터 로드 (Team List와 User Info를 같이 가져와서 처리)
  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        if (!onboardingToken) return;

        // 1. 토큰 디코딩 & 유효성 검사 (Onboarding 페이지에서 수행하므로 여기선 API 호출을 위해 user_id만 추출)
        const payload = JSON.parse(atob(onboardingToken.split('.')[1]));
        const token_user_id = payload.sub;

        setTeamLoading(true);

        // 2. 데이터 병렬 Fetch (내 정보 + 팀 목록)
        const [userData, teamsData] = await Promise.all([
          initFormApi(token_user_id, onboardingToken),
          getTeams({ level: 1 }),
        ]);

        if (!alive) return;

        console.log('User:', userData);
        console.log('Teams:', teamsData);

        setUinfo(userData);
        setTeams(teamsData);

        console.log('INIT DATA CHECK:', {
          userData,
          teamsData,
          userTeamId: userData?.team_id,
          teamsLength: teamsData?.length
        });

        // 3. Form 초기값 설정
        if (userData) {
          // 사용자에게 팀 정보가 없으면, 팀 목록의 첫 번째를 기본값으로 사용
          let defaultTeamId = userData.team_id;
          if (!defaultTeamId && teamsData.length > 0) {
            console.log('User has no team_id, using first team as default:', teamsData[0].team_id);
            defaultTeamId = teamsData[0].team_id;
          }

          form.reset({
            user_id: email,
            user_name: userData.user_name || '',
            user_name_en: userData.user_name_en || '',
            phone: userData.phone || '',
            job_role: userData.job_role || '',
            birth_date: userData.birth_date ? userData.birth_date : undefined,
            hire_date: userData.hire_date ? userData.hire_date : undefined,
            address: userData.address || '',
            emergency_phone: userData.emergency_phone || '',
            team_id: defaultTeamId,
            profile_image: userData.profile_image || '',
          });

          // 초기 이미지 프리뷰 설정
          if (userData.profile_image) {
            setImagePreview(`${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${userData.profile_image}`);
          }
        } else if (teamsData.length > 0) {
          // 사용자 정보는 없지만 팀 목록은 로드된 경우 (예외적 상황)
          form.setValue('team_id', teamsData[0].team_id);
        }

      } catch (e: any) {
        if (!alive) return;
        console.error('Profile Init Error:', e);
        // 401 Unauthorized or other critical errors
        if (e.status === 401 || (e.message && e.message.includes('expired'))) {
          alert('지정시간이 만료 되었습니다.\n프로세스를 초기화 합니다.\n다시 시도해 주세요');
          navigate('/', { replace: true });
        }
      } finally {
        if (alive) setTeamLoading(false);
      }
    }

    init();
    setFocus('user_name');

    return () => {
      alive = false;
    };
  }, [onboardingToken, email, navigate, form, setFocus]);

  // 이미지 드래그 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const res = await onboardingUploadApi(file, onboardingToken);
      if (res.result && res.path) {
        form.setValue('profile_image', res.path);
      } else {
        alert('이미지 업로드에 실패했습니다.');
        setImagePreview(null);
      }
    } catch (e) {
      alert('이미지 업로드 중 오류가 발생했습니다.');
      setImagePreview(null);
    }
  };

  // 사용자에게 010-1234-5678 포맷으로 보여주기 (내부 전송은 숫자만)
  const formatPhone = (raw: string) => {
    const v = raw.replace(/\D/g, '');
    if (v.length <= 3) return v;
    if (v.length <= 7) return `${v.slice(0, 3)}-${v.slice(3)}`;
    return `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
  };

  // 생년월일 YYYY-MM-DD 포맷으로 변경
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  const onSubmit = async (values: ProfileValues) => {
    try {
      setSubmitting(true);

      const payload = {
        ...values,
        team_id: Number(values.team_id),
        birth_date: formatDate(values.birth_date),
        hire_date: formatDate(values.hire_date),
        phone: values.phone.replace(/\D/g, ''),
      };

      const res = await onboardingApi(payload, onboardingToken);
      setTokenStore(res.accessToken);

      if (res.message === 'saved') {
        navigate('/dashboard', { replace: true });
      }
    } catch (e: any) {
      // 토큰 만료 등 인증 에러 처리
      if (e.status === 401 || (e.message && e.message.includes('expired'))) {
        alert('지정시간이 만료 되었습니다.\n프로세스를 초기화 합니다.\n다시 시도해 주세요');
        navigate('/', { replace: true });
        return;
      }
      alert(e.message ?? '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('max-w-xl space-y-5', className)} noValidate>
        {/* 히든 필드: 프로필 이미지 경로 */}
        <input type="hidden" {...form.register('profile_image')} />

        {/* 사진 업로드 영역 */}
        <div className="flex flex-col items-center gap-2 pb-4">
          <div
            className={cn(
              'group relative flex size-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors',
              isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100',
              imagePreview && 'border-none'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Upload className="size-8 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <Upload className="size-8" />
                <p className="text-[10px] font-medium text-center px-2">이미지 업로드</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            클릭하거나 이미지를 드래그하여 프로필 사진을 등록해 주세요.
          </p>
        </div>

        {/* 이메일 (읽기 전용) */}
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비밀번호 */}
        <FormField
          control={form.control}
          name="user_pw"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="영문+숫자 8자 이상"
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="w-full grid grid-cols-2 gap-2">

        {/* 이름 */}
          <FormField
            control={form.control}
            name="user_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름(한글)</FormLabel>
                <FormControl>
                  <Input placeholder="홍길동" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 이름 (영문) */}
          <FormField
            control={form.control}
            name="user_name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름(영문)</FormLabel>
                <FormControl>
                  <Input placeholder="Gildong Hong" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>휴대폰 번호</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder="'-' 없이 입력해 주세요"
                  value={formatPhone(field.value)}
                  onChange={(e) => field.onChange(e.target.value)}
                  maxLength={13}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 팀 & 직무 */}
        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            control={form.control}
            name="team_id"
            render={({ field }) => (
              <FormItem className="mb-auto">
                <FormLabel>팀</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value ? String(field.value) : undefined}
                  key={field.value}
                  name={field.name}
                  disabled={teamLoading}>
                  <FormControl>
                    <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                      <SelectValue placeholder="팀 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-80 w-full">
                    {!teamLoading &&
                      teams.map((t) => (
                        <SelectItem key={t.team_id} value={String(t.team_id)}>
                          {t.team_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job_role"
            render={({ field }) => (
              <FormItem className="mb-auto">
                <FormLabel>포지션</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                  <FormControl>
                    <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                      <SelectValue placeholder="포지션 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-80 w-full">
                    <SelectItem value="Account Executive">Account Executive</SelectItem>
                    <SelectItem value="Account Manager">Account Manager</SelectItem>
                    <SelectItem value="Senior Account Manager">Senior Account Manager</SelectItem>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Senior Designer">Senior Designer</SelectItem>
                    <SelectItem value="Creative Director">Creative Director</SelectItem>
                    <SelectItem value="Front-end Developer">Front-end Developer</SelectItem>
                    <SelectItem value="Back-end Developer">Back-end Developer</SelectItem>
                    <SelectItem value="Producer">Producer</SelectItem>
                    <SelectItem value="Copywriter">Copywriter</SelectItem>
                    <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                    <SelectItem value="GA Specialist">GA Specialist</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 생년월일 & 입사일 */}
        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>생년월일</FormLabel>
                <Popover open={dobOpen} onOpenChange={setDobOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'border-input text-accent-foreground h-11 w-full px-3 text-left text-base font-normal hover:bg-[none]',
                          !field.value && 'text-muted-foreground hover:text-muted-foreground'
                        )}>
                        {field.value ? String(field.value) : <span>YYYY-MM-DD</span>}
                        <Calendar className="ml-auto size-4.5 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      captionLayout="dropdown"
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        const formattedDate = date ? formatDate(date) : null;
                        field.onChange(formattedDate);

                        if (date) setDobOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hire_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>입사일</FormLabel>
                <Popover open={hireOpen} onOpenChange={setHireOpen}>
                  <div className="relative w-full">
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'border-input text-accent-foreground h-11 w-full px-3 text-left text-base font-normal hover:bg-[none]',
                            !field.value && 'text-muted-foreground hover:text-muted-foreground'
                          )}>
                          {field.value ? String(field.value) : <span>YYYY-MM-DD</span>}
                          <Calendar className="ml-auto size-4.5 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                  </div>

                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      captionLayout="dropdown"
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        const formattedDate = date ? formatDate(date) : null;
                        field.onChange(formattedDate);

                        if (date) setHireOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 주소 */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>거주지 주소</FormLabel>
              <FormControl>
                <Input placeholder="서울 강남구 테헤란로 132" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비상연락망 */}
        <FormField
          control={form.control}
          name="emergency_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                비상 연락망 <small>(이름, 관계, 연락처)</small>
              </FormLabel>
              <FormControl>
                <Input placeholder="홍희동, 아버지, 010-0000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <Button type="submit" size="full" disabled={submitting}>
            {submitting ? '저장 중...' : '프로필 저장'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
