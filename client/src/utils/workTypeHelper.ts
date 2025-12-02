/**
 * 근무 타입별 배지 색상 반환
 * @param workType 근무 타입
 * @returns Tailwind CSS 클래스 문자열
 */
export const getWorkTypeColor = (workType: string): string => {
  switch (workType) {
    case "-": return "bg-gray-50 text-gray-400";
    case "일반근무": return "bg-gray-300 text-gray-900";
    case "추가근무": return "bg-gray-700 text-white";
    case "연차": return "bg-primary-blue-150 text-primary-blue";
    case "오전반차": return "bg-primary-purple-100 text-primary-pink-500";
    case "오전반반차": return "bg-primary-purple-100 text-primary-purple-500";
    case "오후반차": return "bg-primary-purple-100 text-primary-pink-500";
    case "오후반반차": return "bg-primary-purple-100 text-primary-purple-500";
    case "외부근무": return "bg-primary-yellow-150 text-primary-orange-600";
    case "재택근무": return "bg-gray-300 text-gray-900";
    case "공가": return "bg-red-100 text-red-600";
    case "공휴일": return "bg-red-200 text-red-700";
    default: return "bg-primary-gray-100 text-primary-gray";
  }
};

