import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useToggleState } from '@/hooks/useToggleState';
import { useUser } from '@/hooks/useUser';
import { mapExcelToExpenseItems } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';
import { uploadFilesToServer, expenseRegister, getBankList, getExpenseType, type BankList } from '@/api';
import { type SingleSelectOption } from '@components/ui/SearchableSelect';
import { ExpenseRow } from './_components/ExpenseRegisterRow';
import { ZoomBoundaryContext } from './context/ZoomContext';
import { UploadArea, type UploadAreaHandle, type PreviewFile } from './_components/UploadArea';

import { pInfoCreate } from '@/api/project/expense';
import { useLoading } from '@/components/common/ui/Loading/Loading';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { SectionHeader } from '@components/ui/SectionHeader';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Button } from '@components/ui/button';

import { DayPicker } from '@components/daypicker';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';

import { Add, Calendar } from '@/assets/images/icons';
import { UserRound, FileText, OctagonAlert, Info } from 'lucide-react';

import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { getMyAccounts, type BankAccount } from '@/api/mypage/profile';
import { AccountSelectDialog } from './_components/AccountSelectDialog';
import { matchNonProjectWithProposal } from '@/api/expense/proposal';

const expenseSchema = z.object({
  el_method: z.string().nonempty('결제 수단을 선택해주세요.'),
  el_title: z.string().optional(),
  account_name: z.string().nonempty('예금주명을 입력해주세요.'),
  bank_code: z.string().nonempty('은행명을 선택해주세요.'),
  bank_name: z.string().optional(),
  bank_account: z
    .string()
    .regex(/^[0-9-]+$/, '계좌번호 형식이 올바르지 않습니다.')
    .nonempty('계좌번호를 입력해주세요.'),
  el_deposit: z.string().optional(),
  remark: z.string().optional(),
  expense_items: z
    .array(
      z
        .object({
          number: z.string().optional(),
          type: z.string().optional(),
          title: z.string().optional(),
          date: z.string().optional(),
          price: z.string().optional(),
          tax: z.string().optional(),
          total: z.string().optional(),
          pro_id: z.number().nullable().optional(),

          // 외주용역비 전용
          tax_type: z.string().optional(),
          work_day: z.string().optional(),
          work_term: z.string().optional(),
          h_name: z.string().optional(),
          h_ssn: z.string().optional(),
          h_tel: z.string().optional(),
          h_addr: z.string().optional(),

          // 접대비 전용
          ent_member: z.string().optional(),
          ent_reason: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (data.type === '외주용역비') {
            const requiredFields = ['tax_type', 'work_day', 'work_term', 'h_name', 'h_ssn', 'h_tel', 'h_addr'] as const;

            requiredFields.forEach((field) => {
              if (!data[field]) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: '필수 입력 항목입니다.',
                  path: [field],
                });
              }
            });
          }

          if (data.type === '접대비') {
            if (!data.ent_member) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: '접대 대상은 필수입니다.',
                path: ['ent_member'],
              });
            }
            if (!data.ent_reason) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: '접대 사유는 필수입니다.',
                path: ['ent_reason'],
              });
            }
          }
        })
    )
    .optional(),
});

export default function ExpenseRegister() {
  const isMobile = useIsMobileViewport();
  const navigate = useNavigate();
  const { user_id, user_name, user_level } = useUser();

  const [zoomBoundary, setZoomBoundary] = useState<DOMRect | null>(null);
  const uploadRef = useRef<UploadAreaHandle>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Alert & Dialog hooks
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const { state } = useLocation(); // Excel 업로드 시 state.excelData 로 전달

  // 비용 항목 기본 세팅값 : Excel 업로드 시 0으로 세팅, 수기 작성 시 5개로 세팅
  const [articleCount, setArticleCount] = useState(state?.excelData ? 0 : 5);
  const [bankList, setBankList] = useState<BankList[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<SingleSelectOption[]>([]); // 비용 유형 API State

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [hasFiles, setHasFiles] = useState(false); // 추가 업로드 버튼 활성화 State
  const [linkedRows, setLinkedRows] = useState<Record<string, number | null>>({}); // 업로드된 이미지와 연결된 행 번호 저장용
  const [activeFile, setActiveFile] = useState<string | null>(null); // UploadArea & Attachment 연결상태 공유용
  const [selectedProposal, setSelectedProposal] = useState<any>(null); //기안서  번호 확인용
  const { showLoading, hideLoading } = useLoading(); // 비용 등록 시 로딩 오버레이 화면

  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : ''); // YYYY-MM-DD Date 포맷 변경

  const form = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      el_method: '',
      el_title: '',
      bank_account: '',
      bank_name: '',
      bank_code: '',
      account_name: '',
      el_deposit: '',
      remark: '',
      expense_items: Array.from({ length: articleCount }).map(() => ({
        type: '',
        title: '',
        number: '',
        date: '',
        price: '',
        tax: '',
        total: '',
        pro_id: null,

        tax_type: '',
        work_day: '',
        work_term: '',
        h_name: '',
        h_ssn: '',
        h_tel: '',
        h_addr: '',

        ent_member: '',
        ent_reason: '',
      })),
    },
  });

  const { control, getValues, setValue } = form;
  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: 'expense_items',
  });

  // Total 계산을 위한 recalcKey State
  const [recalcKey, setRecalcKey] = useState(0);

  const recalcTotal = () => {
    setRecalcKey((k) => k + 1);
  };

  const formattedTotal = useMemo(() => {
    const items = form.getValues('expense_items') || [];
    const sum = items.reduce((acc, i) => acc + (Number(i.total) || 0), 0);
    return sum.toLocaleString();
  }, [recalcKey]);

  useEffect(() => {
    (async () => {
      try {
        const expenseTypeParam = user_level === 'user' ? 'nexp_type2' : 'nexp_type1';

        // 페이지 렌더 시 API 병렬 호출
        const [bankResult, expResult] = await Promise.allSettled([getBankList(), getExpenseType(expenseTypeParam)]);

        // API 개별 결과 관리
        if (bankResult.status === 'fulfilled') {
          const formattedBanks = bankResult.value.map((item: any) => item.code);
          setBankList(formattedBanks);
        } else {
          console.error('은행 목록 불러오기 실패:', bankResult.reason);
        }

        if (expResult.status === 'fulfilled') {
          // 프론트에서 회식비 제외 처리
          const isMealAllowed = user_id === 'sangmin.kang@pmgasia.com' || user_id === 'jaeil.chung@pmgasia.com';
          setExpenseTypes(
            expResult.value
              .filter((t: any) => isMealAllowed || t.code !== '회식비')
              .map((t: any) => ({
                label: t.code,
                value: t.code,
              }))
          );
        } else {
          console.error('비용 유형 불러오기 실패:', expResult.reason);
        }
      } catch (error) {
        // Promise.allSettled 자체는 에러를 던지지 않지만, 안전하게 감싸줌
        console.error('예상치 못한 오류 발생:', error);
      }
    })();
  }, []);

  // Excel 업로드 시 전달받은 rowCount 반영
  useEffect(() => {
    if (state?.excelData && Array.isArray(state.excelData)) {
      const mapped = mapExcelToExpenseItems(state.excelData);

      if (mapped.length > 0) {
        setArticleCount(mapped.length);
        replace(mapped);

        form.reset({
          ...form.getValues(),
          expense_items: mapped,
        });

        recalcTotal();
      } else {
        form.reset({
          ...form.getValues(),
          expense_items: Array.from({ length: 5 }).map(() => ({
            type: '',
            title: '',
            number: '',
            date: '',
            price: '',
            tax: '',
            total: '',
            pro_id: null,

            tax_type: '',
            work_day: '',
            work_term: '',
            h_name: '',
            h_ssn: '',
            h_tel: '',
            h_addr: '',

            ent_member: '',
            ent_reason: '',
          })),
        });
      }
    }
  }, [state]);

  // 항목 추가 버튼 클릭 시
  const handleAddArticle = useCallback(() => {
    setArticleCount((prev) => prev + 1);
    append({
      type: '',
      title: '',
      number: '',
      date: '',
      price: '',
      tax: '',
      total: '',
      pro_id: null,

      tax_type: '',
      work_day: '',
      work_term: '',
      h_name: '',
      h_ssn: '',
      h_tel: '',
      h_addr: '',

      ent_member: '',
      ent_reason: '',
    });
  }, [append]);

  // 항목 삭제 버튼 클릭 시
  const handleRemoveArticle = useCallback(
    (index: number) => {
      if (fields.length === 1) {
        addAlert({
          title: '비용 항목을 삭제할 수 없습니다.',
          message: '최소 1개의 비용 항목이 등록되어야 합니다.',
          icon: <OctagonAlert />,
          duration: 2000,
        });
        return;
      }
      remove(index);
      recalcTotal();
      form.clearErrors('expense_items');
      setArticleCount((prev) => Math.max(prev - 1, 1));
    },
    [fields.length, form, remove]
  );

  // 증빙자료 추가 업로드 버튼 클릭 시 업로드 창 노출
  const handleAddUploadClick = () => {
    uploadRef.current?.openFileDialog();
  };

  // UploadArea에 파일이 업로드 파악 후 setHasFiels State 변경
  const handleFilesChange = (newFiles: PreviewFile[]) => {
    setFiles(newFiles);
    setHasFiles(newFiles.length > 0);
    setLinkedRows((prev) => {
      const updated = { ...prev };
      newFiles.forEach((f) => {
        if (!(f.name in updated)) updated[f.name] = null;
      });
      return updated;
    });
  };

  // UploadArea → AttachmentField 드롭 시
  const handleDropFiles = useCallback((files: PreviewFile[], fieldName: string, rowIndex: number | null) => {
    setLinkedRows((prev) => {
      const updated = { ...prev };
      if (rowIndex === null) {
        files.forEach((file) => {
          if (updated[file.name] !== undefined) updated[file.name] = null;
        });
      } else {
        files.forEach((file) => {
          updated[file.name] = rowIndex;
        });
      }
      return updated;
    });
  }, []);

  // AttachmentField에 개별 업로드 시
  const handleAttachUpload = useCallback(
    (newFiles: PreviewFile[], rowIndex: number | null) => {
      setFiles((prev) => {
        const unique = newFiles.filter((nf) => !prev.some((pf) => pf.name === nf.name));
        return [...prev, ...unique];
      });
      handleDropFiles(newFiles, '', rowIndex);
    },
    [handleDropFiles]
  );

  //내계좌 불러오기
  const [accountList, setAccountList] = useState<BankAccount[]>([]);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const fetchMyAccounts = async () => {
    try {
      const data = await getMyAccounts();
      setAccountList(data);
    } catch (err) {
      console.error('❌ 계좌 목록 불러오기 실패:', err);
    }
  };

  useEffect(() => {
    fetchMyAccounts();
  }, []);

  const handleFillMyMainAccount = () => {
    const mainAcc = accountList.find((acc) => acc.flag === 'mine');

    if (!mainAcc) {
      addAlert({
        title: '계좌 없음',
        message: '대표 계좌가 등록되어 있지 않습니다.',
        icon: <OctagonAlert />,
        duration: 2500,
      });
      return;
    }

    form.setValue('bank_account', mainAcc.bank_account);
    form.setValue('bank_code', bankList.find((b) => b.name === mainAcc.bank_name)?.code || '');
    form.setValue('bank_name', mainAcc.bank_name);
    form.setValue('account_name', mainAcc.account_name);
  };

  //계좌 선택
  const handleOpenAccountDialog = () => {
    setAccountDialogOpen(true);
  };

  const handleSelectAccount = (acc: BankAccount) => {
    form.setValue('bank_account', acc.bank_account);
    form.setValue('bank_code', bankList.find((b) => b.name === acc.bank_name)?.code || '');
    form.setValue('bank_name', acc.bank_name);
    form.setValue('account_name', acc.account_name);

    setAccountDialogOpen(false);
  };

  // 등록 버튼 클릭 시
  const onSubmit = async (values: any) => {
    try {
      const items = values.expense_items.filter((v: any) => v.title || v.price || v.total);

      if (items.length === 0) {
        addAlert({
          title: '작성된 비용 항목이 없습니다.',
          message: '최소 1개의 비용 항목이 작성되어야 합니다.',
          icon: <OctagonAlert />,
          duration: 2000,
        });
        return;
      }

      addDialog({
        title: '작성한 비용 항목을 등록합니다.',
        message: `<span class="text-primary-blue-500 font-semibold">${items.length}</span>건의 비용을 등록하시겠습니까?`,
        confirmText: '확인',
        cancelText: '취소',
        onConfirm: async () => {
          showLoading({
            title: '작성한 <em>비용을 등록</em>하고 있습니다',
            message: '새로고침을 누르거나, 페이지 이탈 시 비용이 저장되지 않습니다.',
          });

          // [1] 연결된 파일 업로드
          const linkedFiles = files.filter((f) => linkedRows[f.name] !== null);
          let uploadedFiles: any[] = [];

          if (linkedFiles.length > 0) {
            // 🔹 행별 그룹화
            const filesByRow = linkedFiles.reduce<Record<number, PreviewFile[]>>((acc, f) => {
              const rowIdx = linkedRows[f.name];
              if (rowIdx !== null) {
                if (!acc[rowIdx]) acc[rowIdx] = [];
                acc[rowIdx].push(f);
              }
              return acc;
            }, {});

            // 🔹 업로드 대상 파일 변환
            const allNewFiles = linkedFiles.map((f) => ({
              ...f,
              rowIdx: linkedRows[f.name]!,
            }));

            const uploadable = await Promise.all(
              allNewFiles.map(async (f) => {
                const res = await fetch(f.preview);
                const blob = await res.blob();

                const ext = f.name.split('.').pop() || 'jpg';

                const item = values.expense_items?.[f.rowIdx - 1];
                const purchaseDate = item?.date ? format(new Date(item.date), 'yyyyMMdd') : format(new Date(), 'yyyyMMdd');

                // ✅ 사용자명, 증빙수단 정제
                const safeUserNm = (user_name || 'unknown').replace(/[^\w가-힣]/g, '');
                const safeElType = (item.type || '기타').replace(/[^\w가-힣]/g, '');

                // ✅ 기존 파일 중 가장 큰 인덱스
                const existingFiles = filesByRow[f.rowIdx] ?? [];
                let maxIndex = -1;

                existingFiles.forEach((att) => {
                  const match = att.name.match(/_(\d+)\.[^.]+$/);
                  if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxIndex) maxIndex = num;
                  }
                });

                // ✅ 같은 rowIdx 내 새 파일 순서
                const newFilesInRow = allNewFiles.filter((nf) => nf.rowIdx === f.rowIdx);
                const localIndex = newFilesInRow.indexOf(f);

                // ✅ 최종 인덱스
                const nextIndex = maxIndex + 1 + localIndex;

                // ✅ 최종 파일명 포맷
                const newFileName = `${safeUserNm}_${safeElType}_${purchaseDate}_${nextIndex}.${ext}`;

                return new File([blob], newFileName, { type: f.type || 'image/png' });
              })
            );

            // 서버 업로드
            uploadedFiles = await uploadFilesToServer(uploadable, 'nexpense');
            uploadedFiles = uploadedFiles.map((file, i) => ({
              ...file,
              rowIdx: allNewFiles[i]?.rowIdx ?? 0,
            }));

            console.log('✅ 업로드 완료:', uploadedFiles);
          }

          // [3] 파일을 항목별로 매핑
          const fileMap = uploadedFiles.reduce(
            (acc, file) => {
              if (!acc[file.rowIdx]) acc[file.rowIdx] = [];
              acc[file.rowIdx].push(file);
              return acc;
            },
            {} as Record<number, any[]>
          );

          // [4] expense_items에 파일 연결
          const enrichedItems = items.map((item: any, idx: number) => ({
            ...item,
            attachments: fileMap[idx + 1] || [], // rowIndex는 1부터 시작해서 +1
          }));

          // [5] 단일 객체로 데이터 전송
          const payload = {
            header: {
              user_id: user_id!,
              el_method: values.el_method,
              el_title: values.el_title || null,
              el_attach: files.length > 0 ? 'Y' : 'N',
              el_deposit: values.el_deposit || '',
              bank_account: values.bank_account.replace(/-/g, ''),
              bank_name: values.bank_name,
              bank_code: values.bank_code,
              account_name: values.account_name,
              remark: values.remark || '',
            },
            items: enrichedItems.map((i: any) => ({
              el_type: i.type,
              ei_title: i.title,
              ei_pdate: i.date,
              ei_number: i.number || null,
              ei_amount: Number(i.price),
              ei_tax: Number(i.tax || 0),
              ei_total: Number(i.total),
              pro_id: i.pro_id ?? null,
              attachments: (i.attachments || []).map((att: any) => ({
                filename: att.fname,
                savename: att.sname,
                url: att.url,
              })),
            })),
          };

          console.log('📦 최종 payload:', payload);

          // 모든 리스트 병렬 API 호출 (성공/실패 결과 각각 수집)
          const result = await expenseRegister(payload);

          console.log('작성 결과', result);

          if (result.ok && result.docs?.inserted) {
            const itemSeqs = result.docs?.results?.[0]?.item_seqs;
            const { list_count, item_count } = result.docs.inserted;

            // ✅ 1. 백엔드 결과(results)를 el_type 기준으로 매핑 그룹 생성
            // 배열을 복사([...res.item_seqs])해서 나중에 순차적으로 하나씩 빼서(shift) 씁니다.
            const resultGroup: Record<string, { list_seq: number; item_seqs: number[] }> = {};
            result.docs.results.forEach((res: any) => {
              resultGroup[res.el_type] = {
                list_seq: res.list_seq,
                item_seqs: [...res.item_seqs],
              };
            });

            // ✅ 2. 기존 items 배열의 순서와 동일하게 listSeq, itemSeq를 할당
            const mappedSeqs = items.map((item: any) => {
              const group = resultGroup[item.type];
              if (!group) return { listSeq: null, itemSeq: null };

              return {
                listSeq: group.list_seq,
                // 같은 타입이 여러 개일 경우를 대비해 배열 앞에서부터 하나씩 꺼냄
                itemSeq: group.item_seqs.shift() || null,
              };
            });

            // 외주용역비 / 접대비 추가 정보 저장
            try {
              const ainfoPromises = items.map((item: any, index: number) => {
                const { listSeq, itemSeq } = mappedSeqs[index];

                if (!listSeq || !itemSeq) return null;

                // 외주용역비
                if (item.type === '외주용역비') {
                  const payload = {
                    exp_idx: listSeq,
                    exp_kind_idx: itemSeq,
                    tax_type: item.tax_type || '',
                    work_term: item.work_term || '',
                    work_day: item.work_day ? `${item.work_day}일` : '',
                    h_name: item.h_name || '',
                    h_ssn: item.h_ssn || '',
                    h_tel: item.h_tel || '',
                    h_addr: item.h_addr || '',
                    exp_type: 'N',
                  };

                  return pInfoCreate(payload);
                }

                // 접대비
                if (item.type === '접대비') {
                  const payload = {
                    exp_idx: listSeq,
                    exp_kind_idx: itemSeq,
                    ent_member: item.ent_member || '',
                    ent_reason: item.ent_reason || '',
                    exp_type: 'N',
                  };

                  return pInfoCreate(payload);
                }

                return null;
              });

              // null 제거 후 병렬 전송
              const filteredPromises = ainfoPromises.filter(Boolean);

              if (filteredPromises.length > 0) {
                await Promise.all(filteredPromises);
                console.log('✅ pInfoCreate 완료');
              }
            } catch (ainfoError) {
              console.error('❌ pInfoCreate 실패:', ainfoError);

              addAlert({
                title: '추가 정보 저장 실패',
                message: '외주/접대 추가 정보 저장 중 오류가 발생했습니다.',
                icon: <OctagonAlert />,
                duration: 2000,
              });
            }

            const uniqueProposalIds = new Set<number>();
            payload.items.forEach((item: any) => {
              if (item.pro_id) {
                uniqueProposalIds.add(item.pro_id);
              }
            });

            // 각 기안서에 대해 매칭 API 호출
            if (uniqueProposalIds.size > 0) {
              try {
                const matchPromises = Array.from(uniqueProposalIds).map(async (rp_seq) => {
                  // 해당 기안서(rp_seq)를 가진 항목들의 seq 찾기
                  const matchingItemSeqs: number[] = [];
                  payload.items.forEach((item: any, index: number) => {
                    if (item.pro_id === rp_seq) {
                      matchingItemSeqs.push(itemSeqs[index]);
                    }
                  });

                  //console.log(`기안서 ${rp_seq}에 매칭될 아이템 seq들:`, matchingItemSeqs);

                  // 각 아이템 seq에 대해 개별 API 호출
                  const itemMatchPromises = matchingItemSeqs.map(async (exp_seq) => {
                    //console.log(`  → 아이템 ${exp_seq} 매칭 중...`);

                    const matchResult = (await matchNonProjectWithProposal(rp_seq, exp_seq)) as { ok: boolean };

                    return { rp_seq, exp_seq, success: matchResult.ok };
                  });

                  return await Promise.all(itemMatchPromises);
                });

                const results = await Promise.all(matchPromises);
              } catch (error) {
                console.error('❌ 매칭 요청 오류:', error);
              }
            } else {
              console.log('ℹ️ 매칭할 기안서 없음');
            }

            addAlert({
              title: '비용 등록이 완료되었습니다.',
              message: `<p>총 <span class="text-primary-blue-500">${item_count}개</span> 비용 항목이 <span class="text-primary-blue-500">${list_count}개</span>의 리스트로 등록 되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });

            hideLoading();

            navigate('/expense');
          } else {
            hideLoading();

            addAlert({
              title: '비용 등록 실패',
              message: `비용 등록 중 오류가 발생했습니다. \n 다시 시도해주세요.`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }
        },
      });
    } catch (err) {
      console.error('❌ 등록 실패:', err);

      hideLoading();

      addAlert({
        title: '비용 등록 실패',
        message: `비용 등록 중 오류가 발생했습니다. \n 다시 시도해주세요.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }
  };

  // UploadArea에서 썸네일 Zoom에 사용할 경계값 설정
  useEffect(() => {
    const update = () => {
      if (contentRef.current) {
        setZoomBoundary(contentRef.current.getBoundingClientRect());
      }
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, []);

  return (
    <>
      <ZoomBoundaryContext.Provider value={zoomBoundary}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-rows-1 gap-6 md:min-h-160 md:grid-cols-6">
              <div ref={contentRef} className="md:col-span-4">
                <SectionHeader title="기본 정보" className="mb-2 md:mb-4" />
                {/* 기본정보 입력 폼 */}
                <div className="mb-6">
                  <FormField
                    control={form.control}
                    name="el_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="gap-.5 h-6 font-bold text-gray-950">
                          증빙 수단<span className="text-primary-blue-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-4 gap-2 md:flex md:gap-1.5 [&_button]:mb-0">
                            <RadioButton value="PMG" label="PMG" variant="dynamic" iconHide />
                            <RadioButton value="MCS" label="MCS" variant="dynamic" iconHide />
                            <RadioButton value="개인카드" label="개인카드" variant="dynamic" iconHide />
                            <RadioButton value="세금계산서" label="세금계산서" variant="dynamic" iconHide />
                            <RadioButton value="현금영수증" label="현금영수증" variant="dynamic" iconHide />
                            <RadioButton value="기타" label="기타" variant="dynamic" iconHide />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid-row-3 mb-12 grid grid-cols-4 gap-2 gap-y-4 tracking-tight md:gap-0 md:gap-y-6">
                  <div className="col-span-4 text-base leading-[1.5] text-gray-700">
                    <FormField
                      control={form.control}
                      name="el_title"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">
                              <TooltipProvider>
                                <Tooltip>
                                  <span className="flex items-center justify-center gap-1">
                                    비용 제목
                                    <TooltipTrigger asChild>
                                      <Info className="size-3 text-gray-500" />
                                    </TooltipTrigger>
                                  </span>
                                  <TooltipContent>미입력 시 자동으로 제목이 생성됩니다.</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Input placeholder="비용 제목을 입력해 주세요" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2 text-base leading-[1.5] text-gray-700 md:col-span-1 md:pr-5">
                    <FormField
                      control={form.control}
                      name="bank_account"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex h-6 items-center justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">
                              계좌번호<span className="text-primary-blue-500">*</span>
                            </FormLabel>
                            <div className="flex h-5.5 overflow-hidden rounded-[var(--spacing)] border-1 border-gray-300">
                              <Button
                                variant="svgIcon"
                                type="button"
                                size="icon"
                                title="내 대표계좌"
                                onClick={handleFillMyMainAccount}
                                className="bg-primary-blue-500/60 hover:bg-primary-blue-500/80 h-full rounded-none">
                                <UserRound className="size-3.5 text-white" />
                              </Button>
                              <Button
                                variant="svgIcon"
                                type="button"
                                size="icon"
                                title="내 계좌리스트"
                                onClick={handleOpenAccountDialog}
                                className="h-full rounded-none bg-gray-400 hover:bg-gray-500/80">
                                <FileText className="size-3.5 text-white" />
                              </Button>
                            </div>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="계좌번호를 입력해 주세요"
                              maxLength={17}
                              {...field}
                              onChange={(e) => {
                                // 숫자(0-9)와 하이픈(-)만 허용
                                const filtered = e.target.value.replace(/[^0-9-]/g, '');
                                field.onChange(filtered);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <AccountSelectDialog
                    open={accountDialogOpen}
                    onOpenChange={setAccountDialogOpen}
                    accounts={accountList}
                    onSelect={handleSelectAccount}
                    onRefresh={fetchMyAccounts}
                  />

                  <div className="md:long-v-divider col-span-2 text-base leading-[1.5] text-gray-700 md:col-span-1 md:px-5">
                    <FormField
                      control={form.control}
                      name="bank_code"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">
                              은행명<span className="text-primary-blue-500">*</span>
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(code) => {
                                const selected = bankList.find((b) => b.code === code);
                                field.onChange(code);
                                form.setValue('bank_name', selected?.name || '');
                              }}
                              name={field.name}
                              defaultValue={bankList.find((b) => b.code === field.value)?.name}>
                              <FormControl>
                                <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                                  <SelectValue placeholder={bankList.length ? '은행 선택' : '불러오는 중...'} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-80 w-full">
                                {bankList.map((item) => (
                                  <SelectItem key={item.code} value={item.code}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:long-v-divider col-span-2 text-base leading-[1.5] text-gray-700 md:col-span-1 md:px-5">
                    <FormField
                      control={form.control}
                      name="account_name"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">
                              예금주명<span className="text-primary-blue-500">*</span>
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Input placeholder="예금주명을 입력해 주세요" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:long-v-divider col-span-2 text-base leading-[1.5] text-gray-700 md:col-span-1 md:px-5">
                    <FormField
                      control={form.control}
                      name="el_deposit"
                      render={({ field }) => {
                        const { isOpen, setIsOpen, close } = useToggleState();

                        return (
                          <FormItem className="flex flex-col">
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">입금희망일</FormLabel>
                            </div>
                            <Popover open={isOpen} onOpenChange={setIsOpen}>
                              <div className="relative w-full">
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={'outline'}
                                      className={cn(
                                        'border-input focus-visible:border-primary-blue-300 h-11 w-full px-3 text-left text-base font-normal text-gray-700 hover:bg-[none]',
                                        !field.value && 'text-muted-foreground hover:text-muted-foreground',
                                        isOpen && 'border-primary-blue-300'
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
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    const formattedDate = date ? formatDate(date) : null;
                                    field.onChange(formattedDate);

                                    if (date) close();
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  <div className="col-span-4 text-base leading-[1.5] text-gray-700">
                    <FormField
                      control={form.control}
                      name="remark"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">비고</FormLabel>
                          </div>
                          <FormControl>
                            <Textarea placeholder="추가 기입할 정보가 있으면 입력해 주세요." className="h-16 min-h-16" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 비용항목 입력 폼 */}
                <SectionHeader title="비용 항목" className="mb-0" />
                <div>
                  {fields.map((field, index) => (
                    <ExpenseRow
                      key={field.id}
                      index={index}
                      control={control}
                      getValues={getValues}
                      setValue={setValue}
                      expenseTypes={expenseTypes}
                      onRemove={handleRemoveArticle}
                      handleDropFiles={handleDropFiles}
                      handleAttachUpload={handleAttachUpload}
                      files={files}
                      activeFile={activeFile}
                      setActiveFile={setActiveFile}
                      onSelectProposal={(proposalId) => {
                        setSelectedProposal(proposalId);
                      }}
                      onTotalChange={recalcTotal}
                    />
                  ))}

                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={handleAddArticle}>
                      비용 항목 추가
                    </Button>
                  </div>
                  <div className="bg-primary-blue-100 mt-2 flex justify-between px-4 py-4 text-base font-medium">
                    <div className="flex w-[66%] justify-between">
                      <span>총 비용</span>
                      <span>{formattedTotal ? formattedTotal : 0} 원</span>
                    </div>
                  </div>
                </div>
              </div>

              {!isMobile && (
                <div className="relative col-span-2">
                  <div className="sticky top-20 left-0 flex h-[calc(100vh-var(--spacing)*22)] flex-col justify-center gap-3 rounded-xl bg-gray-300 p-5">
                    <div className="flex flex-none items-center justify-end">
                      {/* <Link to="" className="text-primary-blue-500 flex gap-0.5 text-sm font-medium">
                      <TooltipNoti className="size-5" />
                      비용 관리 증빙자료 업로드 가이드
                    </Link> */}
                      {hasFiles && (
                        <Button type="button" size="sm" onClick={handleAddUploadClick}>
                          추가 업로드
                        </Button>
                      )}
                    </div>
                    <UploadArea
                      ref={uploadRef}
                      files={files}
                      setFiles={setFiles}
                      onFilesChange={handleFilesChange}
                      linkedRows={linkedRows}
                      activeFile={activeFile}
                      setActiveFile={setActiveFile}
                    />
                    <div className="flex flex-none justify-between">
                      <div className="flex gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => uploadRef.current?.deleteSelectedFiles()}>
                          선택 삭제
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => uploadRef.current?.deleteAllFiles()}>
                          전체 삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center gap-2 md:my-10">
              <Button type="submit" className="min-w-[120px] max-md:flex-1">
                등록
              </Button>
              <Button type="button" variant="outline" className="min-w-[120px] max-md:flex-1" asChild>
                <Link to="/expense">취소</Link>
              </Button>
            </div>
          </form>
        </Form>
      </ZoomBoundaryContext.Provider>
    </>
  );
}
