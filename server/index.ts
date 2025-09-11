// server/index.ts
import 'dotenv/config'; // 환경 변수 로드
import express, { Express } from 'express';
import cors from 'cors'; // cors 미들웨어 임포트
import cookieParser from 'cookie-parser';

import loginRouter from './routes/login';
import refreshRouter from './routes/refresh';
import userRouter from './routes/user';
// import logoutRouter from './routes/logout';

const app: Express = express();

const allowlist = new Set([process.env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean));

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    if (!origin || allowlist.has(origin)) return cb(null, true); // Origin 없는 도구(Postman) 허용
    cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use('/refresh', refreshRouter);
app.use('/', loginRouter);
app.use('/', userRouter);

app.listen(3001, () => {
  console.log(`Server is running on http://localhost:3001`);
});
