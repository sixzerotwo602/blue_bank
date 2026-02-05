# 🎲 Blue Marble Bank (부루마불 뱅크)

오프라인 보드게임 **부루마불(Blue Marble)** 플레이를 돕기 위한 웹 컴패니언 앱입니다. 종이 화폐 대신 스마트폰으로 간편하게 자산을 관리하고 거래할 수 있습니다.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-0.1.0-blue)

## ✨ 주요 기능 (Key Features)

### 🏦 실시간 뱅킹 시스템 (Banking)

- **자산 관리**: 현금 및 부동산 자산 가치를 한눈에 확인
- **송금 (Transfer)**: 플레이어 간 즉시 이체 (QR 코드 불필요, 닉네임 기반)
- **월급 수령**: 버튼 클릭 한 번으로 월급(20만원) 수령
- **자산 구매/비용 지불**: 은행으로의 지불 및 부동산 구매 내역 관리

### 🤝 복지기금 시스템 (Welfare Fund)

- **기부 (Donate)**: 자유로운 금액 기부 가능
- **민주적 수령 절차**: 기금 수령 시 전체 플레이어 투표 진행 (과반수 찬성 시 지급)
- **실시간 투표**: 팝업을 통한 즉각적인 찬성/반대 투표 및 결과 확인

### 🏆 랭킹 시스템 (Ranking)

- **실시간 순위**: 총 자산(현금 + 부동산 가치) 기준 실시간 랭킹 산정
- **시각적 효과**: 1~3위 메달 표시 및 내 순위 하이라이트

### 🔊 사용자 경험 (UX/Polish)

- **반응형 디자인**: 모바일 친화적 인터페이스 (Tailwind CSS)
- **알림 시스템**: 주요 액션(거래, 투표 등)에 대한 Toast 알림
- **사운드 효과**: 거래 성공, 게임 시작, 투표 결과 등에 따른 효과음 제공

---

## 🛠 기술 스택 (Tech Stack)

### Backend

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Communication**: Socket.io (Real-time bidirectional)
- **Deployment**: Render (Self-Hosted Runner w/ PM2) & Cron-job.org (Keep-alive)
- **Test**: Vitest

### Frontend

- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State/Socket**: Custom Hooks (`useGame`, `useSocket`)
- **Deployment**: Cloudflare Pages
- **UX**: `react-hot-toast`, `use-sound`

### Shared

- **Monorepo Structure**: npm workspaces
- **Type Safety**: Shared DTO types between frontend and backend

---

## ☁️ 배포 (Deployment)

이 프로젝트는 프론트엔드와 백엔드가 분리되어 배포됩니다.

### Backend (Self-Hosted on Render /w LXC)

- **방식**: GitHub Actions Self-Hosted Runner를 통해 Render(혹은 LXC 서버)에 직접 배포
- **특징**: PM2를 사용한 무중단 배포 관리
- **Health Check**: `/health` 엔드포인트 제공 (Cron-job.org 연동용)
- **CORS**: Cloudflare Pages 도메인 허용 설정 완료

### Frontend (Cloudflare Pages)

- **방식**: Cloudflare Pages 자동 배포 (GitHub 연동)
- **특징**: `VITE_BACKEND_URL` 환경 변수를 통해 백엔드 주소 동적 바인딩
- **Smart Connection**: 개발 환경(localhost)과 배포 환경(Cloudflare) 자동 감지하여 소켓 연결

---

## 🚀 시작하기 (Getting Started)

### 사전 요구사항 (Prerequisites)

- [Node.js](https://nodejs.org/) (v16 이상 권장)
- npm (v8 이상)

### 설치 (Installation)

```bash
# 레포지토리 클론
git clone https://github.com/your-username/blue-marble-bank.git

# 프로젝트 루트로 이동
cd blue_banker

# 의존성 설치 (루트에서 실행 시 워크스페이스 전체 설치)
npm install
```

### 실행 (Running)

터미널을 2개 열어서 백엔드와 프론트엔드를 각각 실행하거나, 편의를 위해 루트에서 다음 명령어를 사용할 수 있습니다.

**Backend 실행** (Port: 3000)

```bash
npm run dev -w backend
```

**Frontend 실행** (Port: 15485)

```bash
npm run dev -w frontend
```

---

## 📖 사용 방법 (Usage Guide)

1. **방 만들기 (Host)**:
   - 닉네임을 입력하고 '방 만들기'를 클릭합니다.
   - 생성된 **방 번호(Room ID)**를 친구들에게 공유합니다.

2. **방 입장하기 (Guest)**:
   - 닉네임과 공유받은 **방 번호**를 입력하고 '입장하기'를 클릭합니다.

3. **로비 (Lobby)**:
   - 모든 참가자가 모이면 방장이 **'게임 시작'** 버튼을 누릅니다.

4. **게임 플레이 (Dashboard)**:
   - 본인의 차례나 필요할 때 송금, 월급 받기, 기부 등의 기능을 사용합니다.
   - 누군가 무인도에 갇히거나 기금 수령을 요청하면 투표 창이 뜹니다.

---

## 📁 프로젝트 구조 (Project Structure)

```
blue_banker/
├── backend/          # Node.js Socket.io Server
│   ├── src/
│   │   ├── handlers/ # Socket Event Handlers
│   │   ├── models/   # In-memory Data Models
│   │   └── services/ # Business Logic
├── frontend/         # React Client
│   ├── src/
│   │   ├── components/# Reusable UI Components
│   │   ├── hooks/    # Game & Socket Hooks
│   │   └── pages/    # Main Screens (Home, Lobby, Dashboard)
├── shared/           # Shared Types & interfaces
└── specs/            # Project Specifications & Tasks
```

---

## 📄 라이선스 (License)

This project is licensed under the MIT License.
