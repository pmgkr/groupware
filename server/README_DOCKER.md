# Groupware Server Docker 설정

이 문서는 Groupware 서버를 Docker로 실행하는 방법을 설명합니다.

## 사전 요구사항

- Docker
- Docker Compose

## 빠른 시작

### 1. 환경변수 설정

```bash
# env.example을 복사하여 .env 파일 생성
cp env.example .env
```

### 2. Docker Compose로 전체 스택 실행

```bash
# 백그라운드에서 실행
npm run docker:up

# 또는 직접 실행
docker-compose up -d
```

### 3. 서버 상태 확인

```bash
# 로그 확인
npm run docker:logs

# 또는 직접 실행
docker-compose logs -f
```

## 사용 가능한 명령어

### Docker Compose 명령어

```bash
# 전체 스택 시작 (백그라운드)
npm run docker:up

# 전체 스택 중지
npm run docker:down

# 로그 확인
npm run docker:logs

# 모든 컨테이너와 볼륨 삭제
npm run docker:clean
```

### 개별 Docker 명령어

```bash
# 이미지 빌드
npm run docker:build

# 컨테이너 실행
npm run docker:run
```

## 서비스 정보

- **서버**: http://localhost:3001
- **MySQL**: localhost:3306
  - 데이터베이스: groupware
  - 사용자: groupware
  - 비밀번호: groupware123

## 데이터베이스 마이그레이션

Docker Compose로 실행하면 자동으로 Prisma 마이그레이션이 실행됩니다.

수동으로 마이그레이션을 실행하려면:

```bash
# 컨테이너 내부에서 실행
docker-compose exec server npx prisma db push

# 또는 로컬에서 실행 (MySQL이 실행 중일 때)
npx prisma db push
```

## 문제 해결

### 포트 충돌
만약 3001 또는 3306 포트가 이미 사용 중이라면, `docker-compose.yml`에서 포트를 변경하세요.

### 데이터베이스 연결 문제
MySQL 컨테이너가 완전히 시작될 때까지 기다려야 합니다. 로그를 확인하여 MySQL이 준비되었는지 확인하세요.

### 볼륨 초기화
데이터베이스를 완전히 초기화하려면:

```bash
npm run docker:clean
npm run docker:up
```
