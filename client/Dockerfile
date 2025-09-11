# Node.js 20 Alpine 이미지 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# Vite 빌드
RUN npm run build

# nginx로 정적 파일 서빙
FROM nginx:alpine

# 빌드된 파일을 nginx로 복사
COPY --from=0 /app/dist /usr/share/nginx/html

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]
