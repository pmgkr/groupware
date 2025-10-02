import { useUser } from '@/hooks/useUser';

const messages = [
  '언제나 든든한 응원을 보낼게요 🌈',
  '작은 순간도 소중히, 오늘도 화이팅입니다 ✨',
  '작은 행복들이 모여 행복으로 가득한 하루 보내세요 🌼',
  '잠시 쉬어가도 괜찮아요, 쉬어가는 순간도 소중하니까요 ☕',
  '화이팅! 우리는 함께 하고 있어요 💪',
  '마음이 편안해지는 하루가 되길 바랍니다 🌿',
  '오늘도 당신이 가는 길을 응원하고 있습니다 🚀',
];

export default function getWelcomeMessage() {
  const { user_name, birth_date } = useUser();
  const dateSplit = birth_date?.split('-') || [];
  const birth = new Date(Number(dateSplit[0]), Number(dateSplit[1]) - 1, Number(dateSplit[2]));
  const today = new Date();

  const diffDays = Math.ceil((birth.setFullYear(today.getFullYear()) - today.getTime()) / (1000 * 60 * 60 * 24));

  // 생일 당일인 경우
  if (diffDays === 0) {
    return `${user_name}님! 생일 축하합니다 🎂 행복한 하루 보내길 바랍니다 😊`;
  } else if (diffDays > 0 && diffDays <= 7) {
    // 생일이 7일 이내인 경우
    return `${user_name}님! 곧 다가올 생일을 축하합니다! 🎂 `;
  }

  const randomIndex = Math.floor(Math.random() * messages.length);
  return `${user_name}님! ${messages[randomIndex]}`;
}
