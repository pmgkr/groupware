import React, { useEffect, useState } from 'react';
import { getUsers, createUser } from '@/api/users';

function App() {
  const [users, setUsers] = useState<{ id: number; name: string; email: string }[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  // 사용자 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, []);

  // 새로운 사용자 추가
  const handleCreateUser = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const createdUser = await createUser(newUser);
    setUsers([...users, createdUser]); // 기존 목록에 새 사용자 추가
    setNewUser({ name: '', email: '' }); // 입력 필드 초기화
  };

  return (
    <div>
      <h1>사용자 목록</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>

      <hr />

      <h2>새로운 사용자 추가</h2>
      <form onSubmit={handleCreateUser}>
        <input type="text" placeholder="이름" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
        <input
          type="email"
          placeholder="이메일"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <button type="submit">추가</button>
      </form>
    </div>
  );
}

export default App;
