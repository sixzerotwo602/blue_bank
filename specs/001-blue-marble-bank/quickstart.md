# Quickstart: 부루마불 은행

**Feature**: 001-blue-marble-bank
**Prerequisites**: Node.js 20+, npm/yarn/pnpm

## 1. Project Setup

이 프로젝트는 Frontend(React)와 Backend(Node.js)의 모노레포 구조입니다.

### Install Dependencies

루트 및 각 서브디렉토리의 의존성을 설치합니다.

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 2. Running Locally

### Start Backend (Socket Server)

```bash
cd backend
npm run dev
# Server starts on http://localhost:3000
```

### Start Frontend (Client)

```bash
cd frontend
npm run dev
# Client starts on http://localhost:15485
```

## 3. Development Workflow

1. **Backend API 변경 시**: `specs/001-blue-marble-bank/contracts/socket-api.md`를 먼저 업데이트하고, `backend/src/handlers`를 수정합니다.
2. **Frontend UI 변경 시**: `frontend/src/components` 및 `pages`를 수정합니다. Tailwinc CSS 변경 사항은 즉시 반영됩니다 (HMR).
3. **테스트 실행**:

   ```bash
   # Backend Test
   cd backend && npm test

   # Frontend Test
   cd frontend && npm test
   ```

## 4. Troubleshooting

- **포트 충돌**: 3000번 포트가 사용 중이면 `backend/.env` 또는 `app.ts`에서 포트를 변경하세요.
- **Socket 연결 실패**: Frontend의 `.env` 파일에서 `VITE_API_URL`이 Backend 주소와 일치하는지 확인하세요.
