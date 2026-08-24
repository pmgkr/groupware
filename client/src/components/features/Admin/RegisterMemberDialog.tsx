import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DayPicker } from '@components/daypicker';
import { Calendar, Upload } from '@/assets/images/icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { getTeamList, type Team } from '@/api/common/team';
import { uploadFilesToServer } from '@/api/common/upload';
import { registerMember, type RegisterMemberPayload } from '@/api/admin/member';
import { HttpError } from '@/lib/http';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { CheckCircle, OctagonAlert } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const USER_LEVEL_OPTIONS = [
  { value: 'user', label: '일반' },
  { value: 'manager', label: '팀장' },
  { value: 'cellmanager', label: '셀장' },
  { value: 'admin', label: '관리자' },
];

const USER_STATUS_OPTIONS = [
  { value: 'active', label: '사용중' },
  { value: 'inactive', label: '비활성화' },
  { value: 'suspended', label: '휴직중' },
];

const JOB_ROLE_OPTIONS = [
  'Account Executive',
  'Account Manager',
  'Operations Director',
  'Senior Project Manager',
  'Senior Account Manager',
  'Creative Director',
  'Senior Designer',
  'Designer',
  'Front-end Developer',
  'Back-end Developer',
  'Producer',
  'Copywriter',
  'General Manager',
  'Finance Manager',
  'GA Specialist',
];

export default function RegisterMemberDialog({ open, onOpenChange, onSuccess }: Props) {
  const { addAlert } = useAppAlert();

  // 팀 목록
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  // 필수 필드
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userLevel, setUserLevel] = useState<string>('user');
  const [teamId, setTeamId] = useState<number | undefined>();
  const [userStatus, setUserStatus] = useState<string>('active');

  // 선택 필드
  const [userNameEn, setUserNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [hireDate, setHireDate] = useState<string>('');
  const [jobRole, setJobRole] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [branch, setBranch] = useState('seoul');
  const [nfcCard, setNfcCard] = useState('');

  // 이미지 업로드
  const [profileImage, setProfileImage] = useState(''); // 파일명
  const [profileImageUrl, setProfileImageUrl] = useState(''); // 업로드된 웹 경로
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 날짜 팝오버
  const [dobOpen, setDobOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);

  // 제출 상태
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 팀 목록 로드
  useEffect(() => {
    if (open) {
      setTeamLoading(true);
      getTeamList()
        .then((list) => {
          setTeams(list);
          if (list.length > 0 && !teamId) {
            setTeamId(list[0].team_id);
          }
        })
        .finally(() => setTeamLoading(false));
    }
  }, [open]);

  // Dialog 닫힐 때 폼 초기화
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setUserId('');
    setUserName('');
    setUserLevel('user');
    setTeamId(undefined);
    setUserStatus('active');
    setUserNameEn('');
    setPhone('');
    setAddress('');
    setBirthDate('');
    setHireDate('');
    setJobRole('');
    setEmergencyPhone('');
    setBranch('seoul');
    setNfcCard('');
    setProfileImage('');
    setProfileImageUrl('');
    setImagePreview(null);
    setErrors({});
  };

  // 전화번호 포맷
  const formatPhone = (raw: string) => {
    const v = raw.replace(/\D/g, '');
    if (v.length <= 3) return v;
    if (v.length <= 7) return `${v.slice(0, 3)}-${v.slice(3)}`;
    return `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
  };

  // 이미지 업로드 핸들러
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

    // 미리보기
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const uploaded = await uploadFilesToServer([file], 'mypage');
      const f = uploaded[0];
      setProfileImage(f.fname);
      setProfileImageUrl(f.url);
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.');
      setImagePreview(null);
    }
  };

  // 유효성 검사
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!userId.trim()) newErrors.user_id = '이메일(ID)을 입력해주세요.';
    if (!userName.trim()) newErrors.user_name = '이름을 입력해주세요.';
    if (!userLevel) newErrors.user_level = '권한을 선택해주세요.';
    if (!teamId) newErrors.team_id = '팀을 선택해주세요.';
    if (!userStatus) newErrors.user_status = '상태를 선택해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload: RegisterMemberPayload = {
        user_id: userId.trim(),
        user_name: userName.trim(),
        user_level: userLevel as RegisterMemberPayload['user_level'],
        team_id: teamId!,
        user_status: userStatus as RegisterMemberPayload['user_status'],
        ...(userNameEn.trim() && { user_name_en: userNameEn.trim() }),
        ...(phone.trim() && { phone: phone.replace(/\D/g, '') }),
        ...(address.trim() && { address: address.trim() }),
        ...(birthDate && { birth_date: birthDate }),
        ...(hireDate && { hire_date: hireDate }),
        ...(jobRole && { job_role: jobRole }),
        ...(emergencyPhone.trim() && { emergency_phone: emergencyPhone.trim() }),
        ...(profileImage && { profile_image: profileImage }),
        ...(profileImageUrl && { profile_image_url: profileImageUrl }),
        branch: branch || 'seoul',
        ...(nfcCard.trim() && { nfc_card: nfcCard.trim() }),
      };

      await registerMember(payload);

      addAlert({
        title: '사용자 등록 완료',
        message: `<p class="text-center"><span class="font-bold text-primary-blue-500">${userName}</span> 님이 등록되었습니다.</p>`,
        icon: <CheckCircle />,
        duration: 3000,
      });

      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      // 백엔드 409 에러 처리
      if (e instanceof HttpError && e.status === 409) {
        const errorMsg = e.data?.error || '등록에 실패했습니다.';
        addAlert({
          title: '등록 실패',
          message: errorMsg,
          icon: <OctagonAlert />,
          duration: 4000,
        });
        return;
      }

      addAlert({
        title: '등록 실패',
        message: '사용자 등록 중 오류가 발생했습니다. 다시 시도해 주세요.',
        icon: <OctagonAlert />,
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-lg max-lg:w-[460px] max-lg:max-w-[calc(100%-var(--spacing)*8)]">
        <DialogHeader>
          <DialogTitle>새 사용자 등록</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'group relative flex size-28 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors',
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
                    <Upload className="size-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <Upload className="size-6" />
                  <p className="text-[10px] font-medium">프로필 사진</p>
                </div>
              )}
            </div>
          </div>

          {/* 이메일 (필수) */}
          <div className="space-y-1">
            <Label className="text-sm">
              이메일(ID) <span className="text-red-500">*</span>
            </Label>
            <Input
              size="sm"
              placeholder="example@pmgasia.com"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                if (errors.user_id) setErrors((prev) => ({ ...prev, user_id: '' }));
              }}
              className={cn(errors.user_id && 'border-red-500')}
            />
            {errors.user_id && <p className="text-xs text-red-500">{errors.user_id}</p>}
          </div>

          {/* 이름 (필수) + 영문이름 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-sm">
                이름(한글) <span className="text-red-500">*</span>
              </Label>
              <Input
                size="sm"
                placeholder="홍길동"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (errors.user_name) setErrors((prev) => ({ ...prev, user_name: '' }));
                }}
                className={cn(errors.user_name && 'border-red-500')}
              />
              {errors.user_name && <p className="text-xs text-red-500">{errors.user_name}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-sm">이름(영문)</Label>
              <Input size="sm" placeholder="Gildong Hong" value={userNameEn} onChange={(e) => setUserNameEn(e.target.value)} />
            </div>
          </div>

          {/* 권한 (필수) + 상태 (필수) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-sm">
                권한 <span className="text-red-500">*</span>
              </Label>
              <Select value={userLevel} onValueChange={setUserLevel}>
                <SelectTrigger size="sm" className={cn('w-full', errors.user_level && 'border-red-500')}>
                  <SelectValue placeholder="권한 선택" />
                </SelectTrigger>
                <SelectContent>
                  {USER_LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} size="sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_level && <p className="text-xs text-red-500">{errors.user_level}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-sm">
                상태 <span className="text-red-500">*</span>
              </Label>
              <Select value={userStatus} onValueChange={setUserStatus}>
                <SelectTrigger size="sm" className={cn('w-full', errors.user_status && 'border-red-500')}>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} size="sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_status && <p className="text-xs text-red-500">{errors.user_status}</p>}
            </div>
          </div>

          {/* 팀 (필수) + 포지션 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-sm">
                팀 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={teamId?.toString() ?? ''}
                onValueChange={(v) => {
                  setTeamId(Number(v));
                  if (errors.team_id) setErrors((prev) => ({ ...prev, team_id: '' }));
                }}
                disabled={teamLoading}>
                <SelectTrigger size="sm" className={cn('w-full', errors.team_id && 'border-red-500')}>
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.team_id} value={team.team_id.toString()} size="sm">
                      {team.team_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.team_id && <p className="text-xs text-red-500">{errors.team_id}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-sm">포지션</Label>
              <Select value={jobRole} onValueChange={setJobRole}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="포지션 선택" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role} size="sm">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 휴대폰 번호 */}
          <div className="space-y-1">
            <Label className="text-sm">휴대폰 번호</Label>
            <Input
              size="sm"
              inputMode="numeric"
              placeholder="'-' 없이 입력해 주세요"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={13}
            />
          </div>

          {/* 생년월일 + 입사일 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-sm">생년월일</Label>
              <Popover open={dobOpen} onOpenChange={setDobOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'border-input text-accent-foreground w-full px-3 text-left text-sm font-normal hover:bg-[none]',
                      !birthDate && 'text-muted-foreground hover:text-muted-foreground'
                    )}>
                    {birthDate || <span>YYYY-MM-DD</span>}
                    <Calendar className="ml-auto size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DayPicker
                    captionLayout="dropdown"
                    mode="single"
                    selected={birthDate ? new Date(birthDate) : undefined}
                    onSelect={(date) => {
                      setBirthDate(date ? format(date, 'yyyy-MM-dd') : '');
                      if (date) setDobOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">입사일</Label>
              <Popover open={hireOpen} onOpenChange={setHireOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'border-input text-accent-foreground w-full px-3 text-left text-sm font-normal hover:bg-[none]',
                      !hireDate && 'text-muted-foreground hover:text-muted-foreground'
                    )}>
                    {hireDate || <span>YYYY-MM-DD</span>}
                    <Calendar className="ml-auto size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DayPicker
                    captionLayout="dropdown"
                    mode="single"
                    selected={hireDate ? new Date(hireDate) : undefined}
                    onSelect={(date) => {
                      setHireDate(date ? format(date, 'yyyy-MM-dd') : '');
                      if (date) setHireOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 주소 */}
          <div className="space-y-1">
            <Label className="text-sm">거주지 주소</Label>
            <Input size="sm" placeholder="서울 강남구 테헤란로 132" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {/* 비상연락망 */}
          <div className="space-y-1">
            <Label className="text-sm">
              비상 연락망 <small>(이름, 관계, 연락처)</small>
            </Label>
            <Input
              size="sm"
              placeholder="홍희동, 아버지, 010-0000-0000"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
          </div>

          {/* 지점 (branch) */}
          <div className="space-y-1">
            <Label className="text-sm">지점</Label>
            <Input size="sm" placeholder="seoul" value={branch} onChange={(e) => setBranch(e.target.value)} />
          </div>

          {/* NFC 카드 */}
          <div className="space-y-1">
            <Label className="text-sm">NFC 카드</Label>
            <Input
              size="sm"
              placeholder="NFC 카드를 태그하거나 직접 입력하세요"
              value={nfcCard}
              onChange={(e) => setNfcCard(e.target.value)}
              autoComplete="off"
            />
            <p className="text-[11px] text-gray-400">바코드 스캐너 또는 NFC 리더기를 사용하여 입력할 수 있습니다.</p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '등록 중...' : '등록'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
