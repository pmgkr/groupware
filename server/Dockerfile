# server/Dockerfile
# 공식 Node.js 20 버전 이미지를 사용
FROM node:20

# 작업 디렉토리를 /app으로 설정
WORKDIR /app

# package.json과 package-lock.json 파일을 먼저 복사하여 캐시를 활용
COPY package*.json ./

# 종속성 설치
RUN npm install

# 모든 소스 코드를 작업 디렉토리로 복사 (이 시점에 prisma/schema.prisma 파일이 포함됨)
COPY . .

# Prisma 클라이언트 생성 (이제 schema 파일이 있으므로 성공)
RUN npx prisma generate

# 서버 포트 3001번 노출
EXPOSE 3001

# nodemon으로 서버 실행
CMD ["npm", "run", "dev"]