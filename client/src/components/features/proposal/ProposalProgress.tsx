type ApprovalState = 'pending' | 'waiting' | 'approved' | 'rejected';

export interface Step {
  label: string;
  status: ApprovalState;
}

interface ProposalProgressProps {
  steps: Step[];
}

export default function ProposalProgress({ steps }: ProposalProgressProps) {
  const waitingIndex = steps.findIndex((s) => s.status === 'waiting');
  const approvedCount = steps.filter((s) => s.status === 'approved').length;

  const getCircleColor = (status: ApprovalState) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-300';
      case 'approved':
        return 'bg-primary';
      case 'waiting':
        return 'bg-primary-blue-300';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getMiddleDotColor = (index: number) => {
    if (index < approvedCount) return 'bg-primary';
    if (index === approvedCount && waitingIndex === index + 1) return 'bg-primary-blue-300';
    return 'bg-gray-300';
  };

  const getProgressRatio = (steps: Step[]): number => {
    const totalSteps = steps.length;
    const approvedCount = steps.filter((s) => s.status === 'approved').length;
    const waitingIndex = steps.findIndex((s) => s.status === 'waiting');
    const rejectedIndex = steps.findIndex((s) => s.status === 'rejected');

    // 전체 포인트 수 = 4 (dot, step, dot, step)
    const totalPoints = (totalSteps - 1) * 2;

    // 모두 approved인 경우
    if (approvedCount === totalSteps) return 100;

    // rejected가 있는 경우 - rejected 써클까지 도달
    // approved, rejected → dot + step(2) = 2/4 = 50%
    // approved, approved, rejected → dot + step + dot + step(4) = 4/4 = 100%
    if (rejectedIndex !== -1 && approvedCount === rejectedIndex) {
      const pointsReached = approvedCount + rejectedIndex;
      return (pointsReached / totalPoints) * 100;
    }

    // approved가 없는 경우
    if (approvedCount === 0) return 0;

    // waiting이 있고 그 직전까지 approved인 경우
    // approved, waiting → dot(1) = 1/4 = 25%
    // approved, approved, waiting → dot + step + dot(3) = 3/4 = 75%
    if (waitingIndex !== -1 && approvedCount === waitingIndex) {
      const pointsReached = approvedCount + (approvedCount - 1);
      return (pointsReached / totalPoints) * 100;
    }

    // waiting이 없는 경우 (pending만 있음)
    // approved, pending → dot(1) = 1/4 = 25%
    // approved, approved, pending → dot + step(2) = 2/4 = 50%
    const pointsReached = approvedCount;
    return (pointsReached / totalPoints) * 100;
  };

  return (
    <div className="relative w-full">
      {/* --- Progress Bar --- */}
      <div className="absolute top-[49%] left-0 h-[2px] w-full bg-gray-300">
        <div className="bg-primary absolute h-[2px] transition-all duration-300" style={{ width: `${getProgressRatio(steps)}%` }} />
      </div>

      {/* --- Step Circles + Middle Dots as Flex --- */}
      <div className="relative z-[10] flex w-full items-center">
        {steps.map((step, i) => (
          <>
            {/* 큰 점 */}
            <div key={step.label} className="relative flex flex-col items-center">
              <div className={`${getCircleColor(step.status)} h-4 w-4 rounded-full`} />
              <span className="absolute top-6 text-[13px] whitespace-nowrap">{step.label}</span>
            </div>

            {/* 마지막 Step 뒤에는 middle dot 없음 */}
            {i < steps.length - 1 && (
              <div className="flex flex-1 justify-center">
                {/* 항상 정가운데 배치 → 부모 width 변화에도 정확히 25%, 75% */}
                <div className={`${getMiddleDotColor(i)} h-3 w-3 rounded-full`}></div>
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
}
