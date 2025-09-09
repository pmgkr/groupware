import { useUser } from '@/hooks/useUser';

const messages = ['좋은 하루 보내시길 바랍니다 😊', '오늘도 멋지게 해내실 거예요 🚀', '행복한 하루 보내세요 🌼'];

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
