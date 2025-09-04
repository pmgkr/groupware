const API_URL = 'http://localhost:3001/api'; // Express 서버 URL

export const getUsers = async () => {
  const res = await fetch(`${API_URL}/users`);

  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }

  return res.json();
};

export const createUser = async (userData: any) => {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    throw new Error('Failed to create users');
  }

  return res.json();
};
