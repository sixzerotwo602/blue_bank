# Cloudflare 도메인 보호 방안: 단일 서버 + Cloudflare Tunnel

> **작성일:** 2026-02-12
> **배경:** 프론트엔드(Cloudflare Pages)와 백엔드(자체 서버)를 분리 호스팅하던 구조에서, 하나의 자체 서버에 통합하고 구매한 도메인(blue-bank.kr)을 Cloudflare Tunnel로 보호하는 방안을 조사한 문서입니다.

## Context

### 기존 문제점
- 프론트엔드는 Cloudflare Pages (`blue-banker.pages.dev`), 백엔드는 자체 VPS/LXC 서버에서 별도 호스팅
- Cross-Origin 통신으로 인해 CORS 설정 필요
- 프론트엔드에 `VITE_BACKEND_URL` 환경 변수로 백엔드 주소를 주입해야 함
- 백엔드 서버의 포트가 외부에 노출됨

### 해결 방향
- 프론트엔드와 백엔드를 **하나의 자체 서버**에 통합
- **Cloudflare Tunnel**로 포트포워딩 없이 서비스 → 오리진 IP/포트 완벽 은닉
- 단일 도메인 `blue-bank.kr`로 모든 트래픽을 서비스
- Cloudflare 무료 플랜의 DDoS/WAF/SSL 보호를 모든 트래픽에 적용

### 조사된 대안들

| 방안 | 설명 | 채택 여부 |
|------|------|-----------|
| **DNS 프록시 + 서브도메인** | `blue-bank.kr`(프론트) + `api.blue-bank.kr`(백엔드)으로 분리, CORS 필요 | 미채택 |
| **Cloudflare Workers 리버스 프록시** | Worker로 `/api/*` 경로를 백엔드에 프록시, 일 10만 요청 제한 | 미채택 |
| **Cloudflare Tunnel (단일 서버)** | 서버에서 아웃바운드 연결, 포트포워딩 불필요, Same-Origin | **채택** |

---

## 목표 아키텍처

```
사용자 브라우저
    │
    ▼
Cloudflare Edge (DDoS 방어 / WAF / SSL/TLS)
    │
    │  blue-bank.kr → CNAME → <터널-ID>.cfargotunnel.com
    │
    ▼
Cloudflare Tunnel (서버에서 아웃바운드 연결, 인바운드 포트 불필요)
    │
    ▼
자체 서버 localhost:3000 (Express + Socket.io)
    ├─ /              → 정적 파일 (frontend/dist/)
    ├─ /health        → Health check
    └─ /socket.io     → Socket.io (WebSocket)
```

**핵심 특징:**
- **Cloudflare Pages 폐기** → Express가 프론트엔드 정적 파일 직접 서빙
- **CORS 불필요** → Same-Origin
- **`VITE_BACKEND_URL` 불필요** → 같은 도메인
- **인바운드 포트 개방 불필요** → Tunnel이 아웃바운드로 연결

---

## 보호 범위 (Cloudflare 무료 플랜)

| 보호 기능 | 설명 |
|-----------|------|
| **DDoS 방어** | 자동, 무제한, 3초 내 완화 |
| **WAF** | Cloudflare Free Managed Ruleset |
| **SSL/TLS** | Edge 인증서 자동 발급, HTTPS 강제 |
| **오리진 IP 은닉** | Tunnel로 IP 완벽 숨김, 인바운드 포트 불필요 |
| **Bot Fight Mode** | 기본 봇 탐지/차단 |
| **WebSocket 지원** | Tunnel을 통한 Socket.io 프록시 가능 |

---

## 구체적 설정 단계

### 1단계: 가비아에서 `blue-bank.kr` 도메인 구매 + Cloudflare 네임서버 설정
1. **가비아**에서 `blue-bank.kr` 도메인 구매
2. **Cloudflare** 대시보드 → Add a Site → `blue-bank.kr` 입력 → Free 플랜 선택
3. Cloudflare가 할당한 **네임서버 2개**를 확인 (예: `anna.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
4. **가비아** 도메인 관리 → 네임서버 설정 → Cloudflare 네임서버로 변경
5. 네임서버 전파 대기 (최대 24시간, 보통 수 분~수 시간)

### 2단계: 자체 서버에 Cloudflare Tunnel 설정
1. **`cloudflared` 설치:**
   ```bash
   # Debian/Ubuntu
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```

2. **Cloudflare 인증:**
   ```bash
   cloudflared tunnel login
   # 브라우저에서 Cloudflare 계정 인증
   ```

3. **터널 생성:**
   ```bash
   cloudflared tunnel create blue-banker
   # 터널 ID와 credentials 파일이 생성됨
   ```

4. **터널 설정 파일 (`~/.cloudflared/config.yml`):**
   ```yaml
   tunnel: <터널-ID>
   credentials-file: /home/<user>/.cloudflared/<터널-ID>.json

   ingress:
     - hostname: blue-bank.kr
       service: http://localhost:3000
     - service: http_status:404
   ```

5. **DNS 라우팅:**
   ```bash
   cloudflared tunnel route dns blue-banker blue-bank.kr
   # blue-bank.kr → CNAME → <터널-ID>.cfargotunnel.com (자동 생성)
   ```

6. **시스템 서비스 등록:**
   ```bash
   sudo cloudflared service install
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   ```

### 3단계: Cloudflare 보안 설정 (대시보드)
- SSL/TLS → **Full (Strict)**
- Edge Certificates → Always Use HTTPS: **ON**
- Security → WAF → **Cloudflare Managed Ruleset** 배포
- Security → Bots → Bot Fight Mode: **ON**

### 4단계: 코드 변경

#### 4-1. Express에서 프론트엔드 정적 파일 서빙 (`backend/src/app.ts`)
```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 프론트엔드 정적 파일 서빙 (프로덕션)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // SPA fallback: API/socket.io 외 모든 경로 → index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}
```

#### 4-2. CORS 제거 (프로덕션에서 불필요)
```typescript
// 프로덕션: Same-Origin이므로 CORS 불필요
// 개발: localhost에서 프론트/백 포트가 다르므로 CORS 유지
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: getCorsOrigins(), credentials: true }));
}

// Socket.io도 동일하게 조건부 CORS
export const io = new Server(httpServer, {
  cors: process.env.NODE_ENV !== 'production'
    ? { origin: getCorsOrigins(), credentials: true, methods: ['GET', 'POST'] }
    : undefined,
});
```

#### 4-3. 프론트엔드 Socket.io 연결 URL 변경 (`frontend/src/hooks/useSocket.ts`)
```typescript
// Same-Origin이므로 빈 문자열 또는 window.location.origin 사용
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
});
```
- `VITE_BACKEND_URL`을 설정하지 않으면 Socket.io가 현재 페이지의 origin을 자동 사용

#### 4-4. GitHub Actions 워크플로우 변경 (`.github/workflows/deploy.yml`)
- 프론트엔드 빌드 단계 추가
- 배포 시 `frontend/dist/` 포함
- `--exclude 'frontend'` 제거 → `frontend/dist/`만 포함

```yaml
on:
  push:
    branches: ['master']
    paths:
      - 'backend/**'
      - 'frontend/**'    # 프론트엔드 변경도 트리거
      - 'shared/**'
      - '.github/workflows/**'

# 빌드 단계:
- name: Install Dependencies & Build
  run: |
    npm install

    echo "Building Shared..."
    cd shared && npm run build && cd ..

    echo "Building Backend..."
    cd backend && npm run build && cd ..

    echo "Building Frontend..."
    cd frontend && npm run build && cd ..

# 배포 단계:
- name: Deploy to App Directory
  run: |
    rsync -av --delete \
      --exclude '.git' \
      --exclude 'node_modules' \
      --exclude 'backend/node_modules' \
      --exclude 'shared/node_modules' \
      --exclude 'frontend/node_modules' \
      --exclude 'frontend/src' \
      ./ ~/apps/blue_banker/
```

---

## WebSocket (Socket.io) + Cloudflare Tunnel 주의사항

- Cloudflare Tunnel은 WebSocket **지원됨**
- Same-Origin이므로 CORS 문제 없음
- 기존 `transports: ['websocket']` 설정과 호환
- Tunnel 사용 시 10~50ms 추가 레이턴시 (소규모 게임 앱 허용 범위)
- 동시 연결 수 제한은 비공개이나 소규모 앱에서는 문제 없음

---

## 수정해야 할 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `backend/src/app.ts` | 정적 파일 서빙 추가, 프로덕션 CORS 제거, SPA fallback |
| `frontend/src/hooks/useSocket.ts` | `BACKEND_URL` 기본값을 빈 문자열로 변경 |
| `.github/workflows/deploy.yml` | 프론트엔드 빌드 추가, rsync에 frontend/dist 포함, 트리거 경로 추가 |
| 자체 서버 | `cloudflared` 설치 및 터널 설정 (일회성) |

---

## 검증 방법

1. `https://blue-bank.kr` 접속 → 프론트엔드 정상 로딩 확인
2. `https://blue-bank.kr/health` → "Server is awake!" 응답 확인
3. 브라우저 개발자 도구 → Network → WebSocket 연결 성공 (Same-Origin)
4. 브라우저 콘솔에서 CORS 에러 없음 확인
5. Cloudflare 대시보드 → Analytics에서 트래픽 확인
6. `nslookup blue-bank.kr` → Cloudflare IP 반환 (오리진 IP 숨김 확인)

---

## 비용 요약

| 항목 | 비용 |
|------|------|
| Cloudflare 무료 플랜 (DDoS, WAF, SSL, Tunnel) | $0/월 |
| 도메인 (가비아, .kr 기준) | ~₩22,000/년 |
| **총 연간 비용** | **~₩22,000/년** |

---

## 참고 자료
- [Cloudflare Tunnel 설정](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- [Cloudflare Free Plan](https://www.cloudflare.com/plans/free/)
- [Cloudflare WAF 설정](https://developers.cloudflare.com/waf/get-started/)
- [Cloudflare WebSocket 지원](https://developers.cloudflare.com/network/websockets/)
- [Cloudflare Registrar](https://developers.cloudflare.com/registrar/)