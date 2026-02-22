# 외부 UI 생성 도구 호환성 분석

> 작성일: 2026-02-22
> 대상: Blue Bank 프론트엔드 (React 18.2 + Tailwind CSS 3.4 + Vite 5.1)

## 1. 현재 프론트엔드 구조

Atomic Design 패턴 기반으로 `ui/` 계층과 `features/` 계층을 분리하여 운영한다.

```
frontend/src/
├── ui/                    # 재사용 가능한 디자인 시스템 계층
│   ├── atoms/             # 최소 단위 UI 요소
│   │   ├── BaseButton     # 버튼 베이스 컴포넌트
│   │   ├── TextInput      # 텍스트 입력 필드
│   │   ├── ModalBackdrop  # 모달 배경 오버레이
│   │   ├── IconText       # 아이콘 + 텍스트 조합
│   │   └── StatusDot      # 상태 표시 점
│   ├── molecules/         # atom 조합 컴포넌트
│   │   ├── MoneyDisplay   # 금액 표시
│   │   ├── ModalHeader    # 모달 헤더
│   │   ├── AmountField    # 금액 입력 필드
│   │   ├── PlayerRow      # 플레이어 행
│   │   └── VoteTimer      # 투표 타이머
│   ├── organisms/         # 독립적 기능 블록
│   │   ├── QuickActionGrid # 빠른 액션 그리드
│   │   ├── TransactionForm # 거래 폼
│   │   └── VotePanel       # 투표 패널
│   └── templates/         # 페이지 레이아웃 틀
│       ├── HomeTemplate
│       ├── LobbyTemplate
│       └── DashboardTemplate
├── features/              # 비즈니스 로직 결합 컴포넌트
│   ├── ranking/           # 랭킹 관련 (KickPlayerButton, PlayerAssetModal, RankingList)
│   ├── transaction/       # 거래 관련 (ConfirmModal, TransactionModal, TransactionHistory)
│   └── vote/              # 투표 관련 (VotePopup, BankReceiveVotePopup 등)
└── pages/                 # 라우트 엔트리 (Home, Lobby, Dashboard)
```

### 핵심 설계 원칙

- **ui/**: 비즈니스 로직 없음. props만으로 동작. 외부 도구 산출물이 배치되는 계층.
- **features/**: Socket.io, 게임 상태 등 도메인 로직 포함. ui/ 컴포넌트를 조합하여 구성.
- **barrel export**: 각 계층마다 `index.ts`로 re-export하여 `import { BaseButton } from '@/ui'` 형태로 사용.

## 2. 외부 UI 도구 비교

| 도구 | React 지원 | Tailwind 호환 | Atomic Design 적합도 | 비용 |
|---|---|---|---|---|
| **v0.dev** | React JSX 직접 생성 | Tailwind 네이티브 | **최적** — atom/molecule 단위 생성 가능 | 무료 티어 있음 |
| **shadcn/ui** | React 컴포넌트 복사 방식 | Tailwind 기반 | **높음** — 컴포넌트 단위로 복사/수정 가능 | 무료 (오픈소스) |
| **Figma-to-Code** | 플러그인에 따라 다름 | 제한적 | **중간** — 수동 정리 필요 | 플러그인별 상이 |
| **Locofy** | React 지원 | 부분 지원 | **중간** — 코드 품질 편차 있음 | 유료 |

### 2.1 v0.dev (최적 도구)

**장점:**
- Vercel이 만든 AI UI 생성 도구로, React + Tailwind CSS 코드를 직접 출력
- 프롬프트로 "Toss 스타일 금액 입력 필드" 같은 요구사항을 바로 변환 가능
- 생성된 코드가 atom/molecule 수준의 단일 컴포넌트로 나와 `ui/` 계층에 바로 배치 가능

**적용 방법:**
1. v0.dev에서 컴포넌트 생성 (예: "모바일 뱅킹 금액 입력 UI with Tailwind")
2. 생성된 코드를 `ui/atoms/` 또는 `ui/molecules/`에 배치
3. 기존 barrel export(`index.ts`)에 추가
4. `features/` 계층에서 import하여 비즈니스 로직 연결

### 2.2 shadcn/ui

**장점:**
- 컴포넌트를 프로젝트에 직접 복사하는 방식이라 커스터마이징 자유도가 높음
- Tailwind CSS 기반으로 기존 스타일과 충돌 없음
- Radix UI 프리미티브 기반으로 접근성(a11y) 내장

**주의점:**
- `components.json` 설정 및 CSS 변수 체계 도입 필요
- 기존 atom과 역할이 겹칠 수 있으므로 중복 관리 필요

### 2.3 Figma-to-Code

**장점:**
- 디자이너가 Figma에서 작업한 결과를 코드로 변환
- 시각적 정확도가 높음

**주의점:**
- 생성 코드에 불필요한 절대 위치, 고정 크기 값이 포함되는 경우가 많음
- Tailwind 클래스 대신 인라인 스타일이 생성될 수 있음
- 반드시 수동 정리 후 `ui/` 계층에 배치해야 함

## 3. 권장 워크플로우

```
[요구사항] → [v0.dev에서 프로토타입 생성]
           → [생성 코드를 ui/atoms 또는 ui/molecules에 배치]
           → [props 인터페이스 정리 및 기존 컴포넌트와 통합]
           → [features/ 계층에서 비즈니스 로직 연결]
           → [pages/ 에서 최종 조합]
```

### 프롬프트 작성 팁 (v0.dev)

```
# 좋은 예시
"React + Tailwind CSS로 모바일 뱅킹 송금 확인 모달을 만들어줘.
수신자 이름, 금액(한국 원화), 확인/취소 버튼이 포함되어야 해.
Toss 앱 스타일의 깔끔한 디자인으로."

# 나쁜 예시
"뱅킹 앱 만들어줘"  ← 범위가 너무 넓음
```

## 4. 결론

| 항목 | 판단 |
|---|---|
| 최적 도구 | **v0.dev** — React 18 + Tailwind CSS 3.4 스택과 완벽 호환 |
| 보조 도구 | **shadcn/ui** — 접근성 높은 기본 컴포넌트가 필요할 때 |
| 구조 호환성 | Atomic Design의 `ui/` 계층이 외부 도구 산출물을 수용하기에 최적 |
| 핵심 원칙 | 외부 도구 산출물은 반드시 `ui/` 계층(비즈니스 로직 없음)에 배치 |

현재 프로젝트의 React 18 + Tailwind CSS 3.4 스택과 Atomic Design 구조는 외부 UI 생성 도구와의 호환성이 매우 높다. 특히 v0.dev가 생성하는 코드는 별도의 변환 없이 `ui/` 계층에 바로 배치할 수 있어 가장 효율적인 워크플로우를 제공한다.
