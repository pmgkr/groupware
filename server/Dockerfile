# Node.js 20 Alpine 이미지 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# Prisma 스키마 파일 복사 (Prisma generate를 위해 필요)
COPY prisma ./prisma/

# 의존성 설치 (devDependencies 포함 - TypeScript 컴파일을 위해 필요)
RUN npm ci

# Prisma 설치 (Prisma CLI가 필요)
RUN npm install -g prisma

# Prisma 클라이언트 생성
RUN npx prisma generate

# 나머지 소스 코드 복사
COPY . .

# TypeScript 컴파일
RUN npm run build || npx tsc

# 포트 노출
EXPOSE 3001

# 환경변수 설정
ENV NODE_ENV=production

# 애플리케이션 실행
CMD ["node", "dist/index.js"]
