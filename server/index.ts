// server/index.ts
import 'dotenv/config'; // 환경 변수 로드
import express, { Express } from 'express';
import cors from 'cors'; // cors 미들웨어 임포트

import userRouter from './routes/user';
import loginRouter from './routes/login'; 

const app: Express = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/login", loginRouter);


app.listen(3001, () => {
  console.log(`Server is running on http://localhost:3001`);
});
