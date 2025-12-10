// 휴가 로그 타입
export interface VacationLog {
  v_type: string;
  v_count: number;
  [key: string]: any;
}

/**
 * 특정 휴가 타입들의 부여/사용 계산
 * 여러 페이지에서 재사용 가능
 */
export function calcType(logs: VacationLog[], types: string[]) {
  let grant = 0; // 부여된 일수
  let used = 0;  // 사용된 일수 (음수 누적)

  logs.forEach(log => {
    if (!types.includes(log.v_type)) return;

    const v = log.v_count;

    if (v > 0) {
      // 부여 또는 복구(cancel 포함)
      grant += v;
    } else {
      // 사용
      used += v; // 음수 그대로
    }
  });

  return {
    plusDays: grant,
    minusDays: used,
    available: grant + used,
  };
}

/**
 * 기본연차 계산 – cancel 로그 처리 포함
 */
export function calcCurrentYear(logs: VacationLog[]) {
  let grant = 0;
  let used = 0;

  logs.forEach(log => {
    const v = log.v_count;

    // 부여
    if (log.v_type === "current" && v > 0) {
      grant += v;
    }

    // 사용
    if (log.v_type === "current" && v < 0) {
      used += v; // 음수
    }

    // 사용 취소 (복구)
    if (log.v_type === "cancel" && v > 0) {
      used += v; // 음수 사용값 복구
    }
  });

  return {
    plusDays: grant,
    minusDays: used,
    available: grant + used,
  };
}

/**
 * 전체 휴가 계산 묶음
 */
export function calcAllVacation(logs: VacationLog[]) {
  const current = calcCurrentYear(logs);
  const carry = calcType(logs, ["carryover"]);
  const special = calcType(logs, ["special"]);
  const official = calcType(logs, ["official"]);

  const totalPlus =
    current.plusDays + carry.plusDays + special.plusDays;

  const totalMinus =
    current.minusDays + carry.minusDays + special.minusDays;

  return {
    current,
    carry,
    special,
    official,
    total: {
      plusDays: totalPlus,
      minusDays: totalMinus,
    },
    available: totalPlus + totalMinus,
  };
}
