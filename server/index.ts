// server/index.ts
import 'dotenv/config'; // 환경 변수 로드
import express, { Express } from 'express';
import cors from 'cors'; // cors 미들웨어 임포트
import cookieParser from 'cookie-parser';

import loginRouter from './routes/login'; 
import refreshRouter from './routes/refresh';
import userRouter from './routes/user';
import logoutRouter from './routes/logout';

const app: Express = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/login", loginRouter);
app.use("/", refreshRouter);
app.use("/", logoutRouter);
app.use("/", userRouter);

app.listen(3001, () => {
  console.log(`Server is running on http://localhost:3001`);
});
