# client/Dockerfile
FROM node:20

# 작업 디렉토리를 /app으로 설정
WORKDIR /app

# package.json과 package-lock.json 파일을 복사
COPY package*.json ./

# 종속성 설치
RUN npm install

# 모든 소스 코드를 작업 디렉토리로 복사
COPY . .

# 서버 포트 5173번 노출
EXPOSE 5173

# Vite 개발 서버 실행
CMD ["npm", "run", "dev"]