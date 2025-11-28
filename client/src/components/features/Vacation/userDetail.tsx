import { useParams } from 'react-router';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1>사용자 상세 페이지</h1>
      <p>사용자 ID: {id}</p>
    </div>
  );
}

