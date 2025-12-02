export const buildResultMessage = (insertData: number, deleteData: number, updateData: number) => {
  const messages: string[] = [];

  if (insertData > 0) {
    messages.push(`총 <span class="text-primary-blue-500">${insertData}</span>건의 데이터가 <strong>생성</strong>되었습니다.`);
  }

  if (deleteData > 0) {
    messages.push(`총 <span class="text-primary-blue-500">${deleteData}</span>건의 데이터가 <strong>삭제</strong>되었습니다.`);
  }

  if (updateData > 0) {
    messages.push(`총 <span class="text-primary-blue-500">${updateData}</span>건의 데이터가 <strong>수정</strong>되었습니다.`);
  }

  // messages 배열을 <br>로 묶어서 반환
  return messages.join('<br/>');
};
