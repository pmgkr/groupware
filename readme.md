# ✨ Commit Message Convention

커밋 메시지는 다음과 같은 구조로 구성합니다.

```
<type>: <subject>

<body> (optional)

<footer> (optional)
```

예시:

- `docs: Add ProcessThread.md`
- `fix(getUserData): Prevent crash when data is null`

---

## 🧩 Type의 종류

| Type       | 설명                                                              |
| ---------- | ----------------------------------------------------------------- |
| `feat`     | 새로운 기능 추가                                                  |
| `fix`      | 버그 수정                                                         |
| `docs`     | 문서 수정                                                         |
| `style`    | 코드의 의미에 영향을 주지 않는 변경사항 (ex. 포매팅, 세미콜론 등) |
| `design`   | 사용자 UI 디자인 변경 (CSS 등)                                    |
| `refactor` | 기능 변경 없이 코드 리팩토링                                      |
| `perf`     | 성능 개선                                                         |
| `test`     | 테스트 코드 추가 또는 수정                                        |
| `chore`    | 빌드/패키지 매니저 설정 등 기타 잡무                              |
| `ci`       | CI 설정 변경                                                      |
| `release`  | 버전 릴리즈                                                       |
| `rename`   | 파일 혹은 폴더명 변경                                             |
| `remove`   | 파일 삭제                                                         |
| `move`     | 파일 이동                                                         |

---

## 📌 커밋 메시지 7가지 규칙

1. **제목과 본문은 한 줄을 띄워 구분**합니다.
2. **제목은 50자 이내**로 작성합니다.
3. **제목은 국문 혹은 영문(첫글자 대문자)**로 작성합니다. (type이 아님)
   - `readme file modification` ❌
   - `Readme file modification` ⭕
4. **제목 끝에 마침표(`.`)는 사용하지 않습니다.**

   - `Open the door.` ❌
   - `Open the door` ⭕

5. **제목은 명령문 형태로 작성**하고 과거형은 피합니다.

   - `I fixed the bug` ❌
   - `Fix the bug` ⭕

6. **본문은 각 줄이 72자 이내**가 되도록 줄바꿈합니다.
7. **본문에는 "무엇을", "왜" 변경했는지를 설명**합니다. "어떻게"는 선택 사항입니다.

---

## ✅ 예시

```text
feat: Add user authentication logic

Add JWT-based authentication for login endpoint.
This allows secure token-based session management
instead of traditional session cookies.
```

```text
fix(api): Handle null data in user endpoint

Return 400 Bad Request if input is missing.
Fixes a crash when `req.body.user` is undefined.
```

---

# 🌿 Git Branch Naming Convention

프로젝트 개발에서 일관된 브랜치 네이밍을 위한 가이드입니다.

---

## 1. 메인 브랜치

- **main** 또는 **master**
  - 프로젝트의 안정적인 배포 버전 유지
  - 직접 커밋 ❌ / PR(Pull Request)로만 병합 ⭕

---

## 2. 개발 브랜치

- **develop**
  - 기능 개발 및 버그 수정이 이루어지는 기본 브랜치
  - 안정화 후 `main`으로 병합

---

## 3. 기능 브랜치 (Feature Branch)

- **형식**: `feat/{브랜치 이름}`
- **설명**: 새로운 기능 개발을 위한 브랜치
- **예시**:
  - `feat/rocksdb-log-storage`
  - `feat/implement-new-ui`

---

## 4. 버그 수정 브랜치 (Bugfix Branch)

- **형식**: `bugfix/{브랜치 이름}`
- **설명**: 버그 수정 작업용
- **예시**:
  - `bugfix/fix-login-error`
  - `bugfix/correct-missing-dependencies`

---

## 5. 핫픽스 브랜치 (Hotfix Branch)

- **형식**: `hotfix/{브랜치 이름}`
- **설명**: 긴급 수정 (배포 중 발견된 심각한 이슈 등)
- **예시**:
  - `hotfix/security-patch-v1.0.1`
  - `hotfix/fix-critical-bug`

---

## 6. 릴리즈 브랜치 (Release Branch)

- **형식**: `release/{버전}`
- **설명**: 새 배포를 준비하는 브랜치
- **예시**:
  - `release/v1.0.0`
  - `release/v2.1.0`

---

## 7. 실험 브랜치 (Experimental Branch)

- **형식**: `experiment/{브랜치 이름}`
- **설명**: 테스트 또는 실험적 기능 개발용
- **예시**:
  - `experiment/try-new-cache-implementation`
  - `experiment/alternative-logging`

---

## 8. 문서화 브랜치 (Documentation Branch)

- **형식**: `docs/{브랜치 이름}`
- **설명**: 문서 업데이트, README 등 문서 관련 수정
- **예시**:
  - `docs/update-api-docs`
  - `docs/improve-readme`

---

## 9. 리팩토링 브랜치 (Refactor Branch)

- **형식**: `refactor/{브랜치 이름}`
- **설명**: 코드 리팩토링용 브랜치 (기능 변경 없음)
- **예시**:
  - `refactor/clean-up-auth-module`
  - `refactor/optimize-database-queries`

---

## 10. 테스트 브랜치 (Test Branch)

- **형식**: `test/{브랜치 이름}`
- **설명**: 테스트 코드 및 환경 구성 관련 작업
- **예시**:
  - `test/add-unit-tests`
  - `test/integrate-ci`

---

## 11. 작업 번호 포함 규칙 (Optional)

- **형식 예시**: `feat/{기능이름}-#이슈번호`
- **설명**: 이슈 번호와 함께 브랜치 네이밍 (GitHub/Jira 등과 연동 시 유용)
- **예시**:
  - `feat/rocksdb-log-storage-#93`
  - `bugfix/fix-typo-#102`

---

## 12. 네이밍 요약 예시

| 목적      | 예시                               |
| --------- | ---------------------------------- |
| 기능 추가 | `feat/add-user-authentication`     |
| 버그 수정 | `bugfix/resolve-login-issue`       |
| 긴급 수정 | `hotfix/fix-payment-gateway-error` |
| 배포 준비 | `release/v2.0.0`                   |
| 실험 기능 | `experiment/new-caching-strategy`  |
| 문서 수정 | `docs/update-contribution-guide`   |
| 리팩토링  | `refactor/improve-error-handling`  |

---
