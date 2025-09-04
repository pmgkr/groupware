// server/index.ts
import 'dotenv/config'; // 환경 변수 로드
import express, { Express } from 'express';
// ▼▼ npx prisma generate 실행하면 위 경로로 업데이트가 되기때문에 패키지 경로가 아닌 로컬 시스템 경로에 직접 입포트해야함 ▼▼
// import { PrismaClient } from '@prisma/client';
import { PrismaClient } from './generated/prisma';
import cors from 'cors'; // cors 미들웨어 임포트

import createRouter from './routes/user'; // 라우터 함수를 임포트

const app: Express = express();
const port = 3001;

app.use(cors()); // CORS 미들웨어 적용
app.use(express.json());

// Prisma 인스턴스 생성
const prisma = new PrismaClient();

// createRouter 함수에 prisma 인스턴스를 전달하여 라우터를 생성합니다.
const userRoutes = createRouter(prisma);
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
