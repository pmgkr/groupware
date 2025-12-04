export type ApprovalState = '대기' | '진행' | '완료' | '반려';

export interface Step {
  label: string;
  status: ApprovalState;
}

interface ProposalProgressProps {
  steps: Step[];
}

export default function ProposalProgress({ steps }: ProposalProgressProps) {
  const waitingIndex = steps.findIndex((s) => s.status === '대기');
  const approvedCount = steps.filter((s) => s.status === '완료').length;

  // 반려 인덱스 먼저 계산
  const rejectedIndex = steps.findIndex((s) => s.status === '반려');

  // 가장 최근 완료된 스텝의 인덱스 찾기 반려가 있다면 그 이전까지만 완료로 간주
  const lastApprovedIndex =
    rejectedIndex !== -1
      ? -1 // 반려가 있으면 이중원 없음
      : steps.reduce((lastIndex, step, index) => {
          return step.status === '완료' ? index : lastIndex;
        }, -1);

  const getCircleStyle = (status: ApprovalState, index: number) => {
    // 반려가 없고 가장 최근 완료된 원 - 이중원
    if (status === '완료' && index === lastApprovedIndex && rejectedIndex === -1) {
      return {
        innerColor: 'bg-primary',
        borderColor: 'border-primary',
        isDouble: true,
      };
    }

    // 지난 완료 원
    if (status === '완료') {
      return {
        innerColor: 'bg-primary-blue-300',
        borderColor: '',
        isDouble: false,
      };
    }

    // 반려 원
    if (status === '반려') {
      return {
        innerColor: 'bg-red-500',
        borderColor: 'border-red-500',
        isDouble: true,
      };
    }

    // 대기, 진행 등 나머지
    return {
      innerColor: 'bg-gray-300',
      borderColor: '',
      isDouble: false,
    };
  };
  /* 
  const getMiddleDotColor = (index: number) => {
    const currentStep = steps[index];
    const nextStep = steps[index + 1];

    // 현재 스텝이 완료이고 다음 스텝이 진행이면 중간점 표시
    if (currentStep.status === '완료' && nextStep.status === '진행') {
      return 'bg-primary-blue-300';
    }

    // 현재 스텝이 완료이고 다음 스텝도 완료면 중간점 표시
    if (currentStep.status === '완료' && nextStep.status === '완료') {
      return 'bg-primary-blue-300';
    }
    // 현재 스텝이 완료이고 다음 스텝도 반려면 중간점 표시
    if (currentStep.status === '완료' && nextStep.status === '반려') {
      return 'bg-primary-blue-300';
    }

    // 나머지는 회색
    return 'bg-gray-300';
  }; */

  /*  const getProgressRatio = (steps: Step[]): number => {
    const totalSteps = steps.length;
    const approvedCount = steps.filter((s) => s.status === '완료').length;
    const progressIndex = steps.findIndex((s) => s.status === '진행');
    const rejectedIndex = steps.findIndex((s) => s.status === '반려');

    // 전체 포인트 수 = (스텝 수 - 1) * 2 (각 구간마다 중간점 1개)
    const totalPoints = (totalSteps - 1) * 2;

    // 모두 완료인 경우
    if (approvedCount === totalSteps) return 100;

    // 완료가 없는 경우
    if (approvedCount === 0) return 0;

    // 반려가 있는 경우 - 반려 원까지 도달
    if (rejectedIndex !== -1) {
      // 완료, 반려 → 중간점(1) = 1/6 ≈ 16.67%
      // 완료, 완료, 반려 → 중간점 + 원 + 중간점(3) = 3/6 = 50%
      const pointsReached = rejectedIndex * 2;
      return (pointsReached / totalPoints) * 100;
    }

    // 진행 중인 스텝이 있는 경우
    if (progressIndex !== -1) {
      // 완료, 진행 → 중간점(1) = 1/6 ≈ 16.67%
      // 완료, 완료, 진행 → 중간점 + 원 + 중간점(3) = 3/6 = 50%
      const pointsReached = progressIndex * 2 - 1;
      return (pointsReached / totalPoints) * 100;
    }

    // 대기만 있는 경우 (완료 다음이 모두 대기)
    // 완료, 대기 → 중간점(1) = 1/6 ≈ 16.67%
    // 완료, 완료, 대기 → 중간점 + 원 + 중간점(3) = 3/6 = 50%
    const pointsReached = approvedCount * 2 - 1;
    return (pointsReached / totalPoints) * 100;
  }; */

  const getMiddleDotColor = (index: number) => {
    const currentStep = steps[index];

    // 현재 스텝이 완료이면 다음 중간점 파란색
    if (currentStep.status === '완료') {
      return 'bg-primary-blue-300';
    }

    // 나머지는 회색
    return 'bg-gray-300';
  };

  const getProgressRatio = (steps: Step[]): number => {
    const totalSteps = steps.length;
    const approvedCount = steps.filter((s) => s.status === '완료').length;
    const rejectedIndex = steps.findIndex((s) => s.status === '반려');

    // 전체 포인트 수 = (스텝 수 - 1) * 2 (각 구간마다 중간점 1개씩)
    const totalPoints = (totalSteps - 1) * 2;

    // 모두 완료인 경우
    if (approvedCount === totalSteps) return 100;

    // 완료가 없는 경우
    if (approvedCount === 0) return 0;

    // 반려가 있는 경우 - 반려 원까지 도달
    if (rejectedIndex !== -1) {
      // 완료 반려 대기 => 반려 원까지 (포인트 2) = 2/4 = 50%
      // 완료 완료 반려 => 반려 원까지 (포인트 4) = 4/4 = 100%
      const pointsReached = rejectedIndex * 2;
      return (pointsReached / totalPoints) * 100;
    }

    // 반려가 없는 경우
    // 완료 대기 대기 => 1개 완료 => 포인트 1 (중간점) = 1/4 = 25%
    // 완료 완료 대기 => 2개 완료 => 포인트 3 (중간점+원+중간점) = 3/4 = 75%
    const pointsReached = approvedCount * 2 - 1;
    return (pointsReached / totalPoints) * 100;
  };

  return (
    <div className="relative bottom-2.5 w-full">
      {/* --- Progress Bar --- */}
      <div className="absolute top-[44%] right-0 h-[2px] w-[98%] bg-gray-300">
        <div
          className="bg-primary-blue-300 absolute h-[2px] transition-all duration-300"
          style={{ width: `${getProgressRatio(steps)}%` }}
        />
      </div>

      {/* ---각 스텝의 스타일 정보 가져오기 --- */}
      <div className="relative z-[10] flex w-full items-center">
        {steps.map((step, i) => {
          const circleStyle = getCircleStyle(step.status, i);

          return (
            <>
              {/* 큰 점 */}
              <div key={step.label} className="relative flex flex-col items-center">
                {circleStyle.isDouble ? (
                  //완료 이중원
                  <div className={`bg-white ${circleStyle.borderColor} flex h-5 w-5 items-center justify-center rounded-full border-1`}>
                    <div className={`${circleStyle.innerColor} h-3 w-3 rounded-full`} />
                  </div>
                ) : (
                  // 단일원
                  <div className={`${circleStyle.innerColor} h-3 w-3 rounded-full`} />
                )}
                <span className="absolute top-6 text-[13px] whitespace-nowrap">{step.label}</span>
              </div>

              {/* 마지막 Step 뒤에는 middle dot 없음 */}
              {i < steps.length - 1 && (
                <div className="flex flex-1 justify-center">
                  <div className={`${getMiddleDotColor(i)} h-2 w-2 rounded-full`}></div>
                </div>
              )}
            </>
          );
        })}
      </div>
    </div>
  );
}
