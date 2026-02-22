# 개발 환경 구축

> Blue Bank 프로젝트의 로컬 개발 환경 설정 가이드.

---

## 사전 요구사항

- **Node.js** 18 이상
- **npm** 8 이상 (워크스페이스 지원 필요)
- Git

---

## 설치

```bash
# 레포지토리 클론
git clone https://github.com/your-username/blue-marble-bank.git
cd blue_banker

# 워크스페이스 전체 의존성 설치
npm install
```

---

## 빌드 순서

shared → backend → frontend 순서로 빌드해야 한다. shared 패키지가 다른 패키지의 타입 의존성이기 때문이다.

```bash
# 1. shared 빌드 (타입 정의)
npm run build -w shared

# 2. backend 빌드
npm run build -w backend

# 3. frontend 빌드
npm run build -w frontend
```

---

## 개발 서버 실행

터미널 2개를 열어 각각 실행한다:

### Backend (포트 15645)

```bash
npm run dev -w backend
```

### Frontend (포트 15485)

```bash
npm run dev -w frontend
```

프론트엔드는 Vite 개발 서버로 실행되며, 백엔드 소켓 서버에 자동으로 연결된다.

---

## 환경 변수

### Backend

`.env` 파일을 `backend/` 디렉토리에 생성한다:

```env
PORT=15645
NODE_ENV=development
```

### Frontend

프론트엔드는 Vite 환경변수를 사용한다:

```env
# frontend/.env (개발 환경)
VITE_BACKEND_URL=http://localhost:15645
```

`VITE_BACKEND_URL`이 설정되지 않으면, 프론트엔드는 현재 호스트의 IP:15645로 자동 연결을 시도한다.

---

## Windows 환경 주의사항

bash 셸에서 경로를 입력할 때 **forward slash**를 사용해야 한다:

```bash
# 올바른 경로
cd "E:/github_coop/blue_bank/shared"

# 잘못된 경로 (backslash는 bash에서 실패)
cd "E:\github_coop\blue_bank\shared"
```

---

## 디버깅 팁

### Socket.io DEBUG 로그

Socket.io 디버그 로그를 활성화하여 이벤트 송수신을 추적할 수 있다:

```bash
# 백엔드: Socket.io 디버그 로그 활성화
DEBUG=socket.io* npm run dev -w backend

# 프론트엔드: 브라우저 콘솔에서 활성화
localStorage.debug = 'socket.io-client:socket'
```

### React DevTools

React DevTools 브라우저 확장을 설치하면 컴포넌트 트리와 상태를 확인할 수 있다.

### 유용한 명령어

```bash
# 전체 린트
npm run lint

# 전체 테스트
npm test

# shared 타입 변경 후 빌드 확인
npm run build -w shared
```

---

## 모노레포 구조

```
blue_banker/
├── package.json          # 워크스페이스 루트
├── shared/               # 공유 타입 패키지 (blue-bank-shared)
│   ├── src/index.ts      # 모든 인터페이스, 열거형, 이벤트 타입
│   └── tsconfig.json
├── backend/              # Express + Socket.io 서버
│   ├── src/
│   │   ├── application/  # UseCases + DI
│   │   ├── domain/       # 순수 함수 + 리포지토리 인터페이스
│   │   ├── handlers/     # Socket.io 이벤트 핸들러
│   │   ├── infrastructure/  # MemoryStore + 리포지토리 구현체
│   │   └── utils/        # 상수, 검증, 타이머, Rate Limiter
│   └── tsconfig.json
└── frontend/             # React + Vite 클라이언트
    ├── src/
    │   ├── ui/           # Atomic Design 컴포넌트
    │   ├── features/     # 비즈니스 로직 모듈
    │   ├── pages/        # 라우트 엔트리포인트
    │   ├── hooks/        # useGame, useSocket
    │   └── contexts/     # MoneyFormatContext
    └── tsconfig.json
```

---

## 참조

- [README.md](../README.md) — 프로젝트 소개 및 기본 사용법
- [architecture.md](./architecture.md) — 백엔드 아키텍처 상세
- [frontend-architecture.md](./frontend-architecture.md) — 프론트엔드 구조 상세
