// src/api/common/types.ts

// ------------------------------
// 공통 코드 타입 (비용, 프로젝트 공통)
// ------------------------------

/** 비용유형 공통 코드 */
export interface ExpenseType {
  code: string;
  name?: string; // 서버에서 name 내려주는 경우 대비
}

/** 은행 목록 공통 코드 */
export interface BankList {
  code: string;
  name: string;
}
