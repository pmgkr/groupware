export const buildResultMessage = (insertData: number, deleteData: number, updateData: number) => {
  const messages: string[] = [];

  if (insertData > 0) {
    messages.push(`<span class="text-primary-blue-500">${insertData}</span>건의 데이터가 생성`);
  }

  if (deleteData > 0) {
    messages.push(`<span class="text-primary-blue-500">${deleteData}</span>건의 데이터가 삭제`);
  }

  if (updateData > 0) {
    messages.push(`<span class="text-primary-blue-500">${updateData}</span>건의 데이터가 수정`);
  }

  // messages 배열을 <br>로 묶어서 반환
  return messages;
};
