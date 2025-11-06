# 시스템 리소스 모니터링 시스템 - 코드 리뷰

**리뷰 일시**: 2025-11-06
**프로젝트**: System Resource Monitor
**리뷰어**: Claude Code Review

---

## 목차
1. [심각한 보안 취약점](#1-심각한-보안-취약점)
2. [중간 수준 보안 문제](#2-중간-수준-보안-문제)
3. [코드 품질 문제](#3-코드-품질-문제)
4. [성능 및 리소스 관리](#4-성능-및-리소스-관리)
5. [아키텍처 및 설계](#5-아키텍처-및-설계)
6. [의존성 관리](#6-의존성-관리)
7. [권장사항 요약](#7-권장사항-요약)

---

## 1. 심각한 보안 취약점

### 1.1 무제한 CORS 허용 (Critical)

**위치**: `server.js:9`

```javascript
app.use(cors());
```

**문제점**:
- 모든 출처(origin)에서의 요청을 허용함
- 악의적인 웹사이트가 사용자의 브라우저를 통해 시스템 정보를 탈취 가능
- CSRF 공격에 취약

**위험도**: 🔴 Critical

**시나리오**:
1. 공격자가 악의적인 웹페이지를 생성
2. 사용자가 모니터링 서버가 실행 중인 상태에서 해당 페이지 방문
3. 공격자의 페이지가 `http://localhost:3000/api/resources`에 요청
4. CPU 모델, OS 정보, 네트워크 인터페이스, 호스트명 등 민감한 정보 탈취

**권장사항**:
- 특정 출처만 허용하도록 CORS 설정
- 개발 환경에서만 localhost 허용
- 프로덕션 환경에서는 화이트리스트 기반 접근 제어

---

### 1.2 Cross-Site Scripting (XSS) 취약점 (High)

**위치**: `public/app.js:258-260`, `298-306`, `310-316`

```javascript
document.getElementById('system-info').innerHTML = `
    ${data.system.platform} | ${data.system.distro} | ${data.system.arch}
`;

diskTableBody.innerHTML = data.disk.details.map(disk => `
    <tr>
        <td>${disk.fs}</td>
        ...
    </tr>
`).join('');
```

**문제점**:
- 서버에서 받은 데이터를 검증 없이 `innerHTML`로 직접 삽입
- `systeminformation` 라이브러리가 반환하는 데이터에 HTML/JavaScript가 포함될 경우 실행됨
- 파일시스템 이름, 네트워크 인터페이스 이름 등에 특수문자 포함 가능

**위험도**: 🟠 High

**공격 시나리오**:
- 악의적으로 조작된 파일시스템 라벨 또는 네트워크 인터페이스 이름이 있는 경우
- 예: 마운트 포인트 이름이 `<img src=x onerror=alert('XSS')>`인 경우

**권장사항**:
- `textContent` 또는 `innerText` 사용
- HTML 이스케이프 함수 구현 및 적용
- DOMPurify 같은 라이브러리 사용

---

### 1.3 민감한 시스템 정보 노출 (High)

**위치**: `server.js:133-138`

```javascript
system: {
    platform: osInfo.platform,
    distro: osInfo.distro,
    arch: osInfo.arch,
    hostname: osInfo.hostname
}
```

**문제점**:
- 호스트명, OS 정보, 아키텍처 등 민감한 정보를 인증 없이 노출
- CPU 모델 및 코어 수 정보 노출로 타겟팅된 공격 가능
- 네트워크 인터페이스 정보로 네트워크 구조 파악 가능

**위험도**: 🟠 High

**공격자가 얻을 수 있는 정보**:
- 시스템 지문(fingerprinting)
- 특정 OS/CPU의 알려진 취약점 활용
- 네트워크 토폴로지 정보
- 물리적 호스트 식별

**권장사항**:
- 인증 메커니즘 추가 (JWT, Session, API Key 등)
- 노출할 정보의 범위를 최소화
- 호스트명 대신 익명화된 ID 사용
- Rate Limiting 적용

---

### 1.4 인증 및 권한 부재 (Critical)

**위치**: 전체 애플리케이션

**문제점**:
- 모든 API 엔드포인트가 인증 없이 접근 가능
- 로컬 네트워크에 노출 시 누구나 시스템 정보 조회 가능
- 서버가 `0.0.0.0`으로 바인딩되면 외부 접근 가능

**위험도**: 🔴 Critical

**공격 시나리오**:
1. 방화벽 설정 오류로 포트 3000이 외부에 노출
2. 누구나 시스템 리소스 모니터링 정보 접근
3. DDoS 공격 시점 파악, 시스템 부하 모니터링 등 악용 가능

**권장사항**:
- 기본 인증(Basic Auth) 최소한 적용
- IP 화이트리스트 구현
- localhost(127.0.0.1)에만 바인딩
- VPN 또는 SSH 터널을 통한 접근만 허용

---

## 2. 중간 수준 보안 문제

### 2.1 CDN 의존성 보안 위험 (Medium)

**위치**: `public/index.html:8-10`

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

**문제점**:
- CDN이 손상되거나 변조되면 악의적인 코드 실행 가능
- SRI(Subresource Integrity) 체크섬 미사용
- 네트워크 차단 시 애플리케이션 작동 불가

**위험도**: 🟡 Medium

**권장사항**:
- SRI 해시 추가
- 로컬에 라이브러리 복사본 유지
- Content Security Policy(CSP) 헤더 설정

---

### 2.2 에러 메시지 정보 노출 (Medium)

**위치**: `server.js:143-144`

```javascript
console.error('Error fetching system resources:', error);
res.status(500).json({ error: 'Failed to fetch system resources' });
```

**문제점**:
- 개발 환경에서는 상세한 에러 스택이 콘솔에 출력될 수 있음
- 에러 메시지가 시스템 구조나 파일 경로 노출 가능

**위험도**: 🟡 Medium

**권장사항**:
- 프로덕션 환경에서는 일반화된 에러 메시지만 반환
- 상세 에러는 로그 파일에만 기록
- 에러 코드 시스템 도입

---

### 2.3 Denial of Service (DoS) 취약점 (Medium)

**위치**: `server.js:26-146`

**문제점**:
- Rate limiting 없음
- 동시 요청 제한 없음
- `/api/resources` 엔드포인트가 많은 시스템 호출 수행
- 공격자가 반복 요청으로 시스템 리소스 고갈 가능

**위험도**: 🟡 Medium

**공격 시나리오**:
- 초당 수백~수천 개의 요청 전송
- 서버 CPU/메모리 고갈
- 시스템 모니터링 불가능

**권장사항**:
- `express-rate-limit` 미들웨어 추가
- IP당 요청 제한 설정 (예: 초당 10개)
- 동시 요청 수 제한

---

### 2.4 메모리 내 데이터 무제한 증가 가능성 (Medium)

**위치**: `server.js:14-21`, `84-92`

```javascript
const historyData = {
    timestamps: [],
    cpu: [],
    memory: [],
    disk: [],
    network: { rx: [], tx: [] },
    temperatures: []
};
```

**문제점**:
- `maxDataPoints` 제한이 있지만 (300개)
- 여러 클라이언트가 동시 접속 시 각각 데이터 누적
- 서버가 장시간 실행되면 메모리 누수 가능성

**위험도**: 🟡 Medium

**권장사항**:
- 전역 변수 대신 세션별 데이터 관리
- Redis 같은 외부 저장소 사용
- 데이터 만료 정책 구현

---

## 3. 코드 품질 문제

### 3.1 중복 코드

**위치**: `server.js:28-36`

```javascript
const [cpu, mem, disk, network, temp, currentLoad, fsSize, osInfo] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.fsSize(),  // 중복
    si.networkStats(),
    si.cpuTemperature(),
    si.currentLoad(),
    si.fsSize(),  // 중복
    si.osInfo()
]);
```

**문제점**:
- `si.fsSize()`가 두 번 호출됨
- 불필요한 시스템 호출로 성능 저하

---

### 3.2 에러 처리 불충분

**위치**: `public/app.js:321-323`, `auto-monitor.js:484-486`

```javascript
} catch (error) {
    console.error('Error fetching resources:', error);
}
```

**문제점**:
- 에러 발생 시 사용자에게 알림 없음
- 네트워크 오류 시 화면이 업데이트되지 않음
- 에러 복구 메커니즘 부재

**권장사항**:
- 사용자에게 시각적 피드백 제공
- 재시도 로직 구현
- 연속 실패 시 알림 표시

---

### 3.3 하드코딩된 URL 및 포트

**위치**:
- `server.js:7` - `const PORT = 3000;`
- `public/app.js:245` - `http://localhost:3000/api/resources`
- `auto-monitor.js:17` - `http://localhost:3000/api/resources`
- `monitor.js:12` - `args: ['--no-sandbox', '--disable-setuid-sandbox']`

**문제점**:
- 환경별 설정 불가능
- 포트 충돌 시 수동 수정 필요
- 배포 환경에 맞게 수정 어려움

**권장사항**:
- 환경변수 사용 (`.env` 파일)
- 설정 파일 분리 (`config.js`)
- 포트 자동 감지 또는 fallback 구현

---

### 3.4 타입 안정성 부재

**위치**: 전체 JavaScript 코드

**문제점**:
- TypeScript 미사용으로 타입 오류 가능성
- API 응답 구조 변경 시 런타임 에러 발생 가능
- IDE 자동완성 및 리팩토링 지원 제한적

**권장사항**:
- TypeScript 도입 고려
- JSDoc으로 최소한의 타입 정보 추가
- API 응답 스키마 검증 (Joi, Zod 등)

---

## 4. 성능 및 리소스 관리

### 4.1 과도한 폴링 빈도 (Low)

**위치**: `public/app.js:442`

```javascript
updateInterval = setInterval(fetchResources, 1000); // 1초마다
```

**문제점**:
- 1초마다 전체 시스템 정보 요청
- 서버 부하 증가
- 배터리 소모 (모바일 환경)
- 대부분의 시스템 정보는 1초마다 크게 변하지 않음

**권장사항**:
- WebSocket 또는 Server-Sent Events 사용
- 폴링 간격을 2-5초로 증가
- 사용자가 간격 조정 가능하도록 설정 제공

---

### 4.2 메모리 누수 가능성

**위치**: `public/app.js:331-368`

**문제점**:
- Chart.js 인스턴스가 파괴되지 않음
- 페이지 이탈 시 `setInterval` 정리 안 됨
- DOM 참조 해제 안 됨

**권장사항**:
- `beforeunload` 이벤트에서 정리 작업 수행
- Chart 인스턴스 destroy 메서드 호출
- `clearInterval` 호출 보장

---

### 4.3 대용량 데이터 처리

**위치**: `auto-monitor.js:309-315`

```javascript
const timestamps = ${JSON.stringify(timestamps)};
const cpuData = ${JSON.stringify(cpuData)};
// ... 모든 데이터를 인라인으로 직렬화
```

**문제점**:
- 5분간 300개 데이터 포인트 * 여러 메트릭 = 큰 HTML 파일
- 브라우저 메모리 부담
- 파일 크기 증가

**권장사항**:
- 데이터를 별도 JSON 파일로 저장
- 차트 라이브러리에 lazy loading 적용
- 데이터 샘플링 또는 압축

---

## 5. 아키텍처 및 설계

### 5.1 관심사 분리 부족

**문제점**:
- `server.js`에 모든 로직이 한 파일에 집중
- 라우팅, 비즈니스 로직, 데이터 관리 혼재
- 테스트 어려움

**권장사항**:
```
project/
├── routes/
│   └── api.js
├── controllers/
│   └── resourceController.js
├── services/
│   └── monitoringService.js
├── middleware/
│   ├── auth.js
│   └── rateLimit.js
└── server.js
```

---

### 5.2 상태 관리 문제

**위치**: `server.js:14-21`

**문제점**:
- 전역 변수로 상태 관리
- 멀티 인스턴스 환경에서 데이터 불일치
- 서버 재시작 시 데이터 손실

**권장사항**:
- 영속성 있는 저장소 사용 (Redis, SQLite)
- 상태 관리 라이브러리 사용
- 클러스터 모드 고려

---

### 5.3 확장성 제한

**문제점**:
- 단일 서버만 지원
- 여러 시스템 모니터링 불가
- 실시간 알림 기능 없음
- 히스토리 데이터 제한적

**권장사항**:
- 마이크로서비스 아키텍처 고려
- 메시지 큐 도입 (RabbitMQ, Kafka)
- 타임시리즈 DB 사용 (InfluxDB, Prometheus)

---

## 6. 의존성 관리

### 6.1 구형 의존성

**위치**: `package.json:14`

```json
"puppeteer": "^21.5.2"
```

**문제점**:
- npm 경고: `< 24.15.0 is no longer supported`
- 보안 패치 미적용 가능성
- Chrome 다운로드 실패 문제 (설치 로그 확인됨)

**권장사항**:
- 최신 버전으로 업데이트
- 정기적인 의존성 업데이트 프로세스 구축
- `npm audit` 정기 실행

---

### 6.2 불필요한 의존성

**위치**: `package.json:14`

**문제점**:
- `puppeteer`가 설치되지만 실제로 사용 안 됨 (설치 실패)
- `monitor.js`가 사용되지 않음
- 프로젝트 크기 증가

**권장사항**:
- 사용하지 않는 의존성 제거
- `devDependencies`와 `dependencies` 구분
- 번들 크기 최적화

---

### 6.3 보안 취약점 점검 부재

**문제점**:
- 의존성 보안 스캔 자동화 없음
- 알려진 취약점 존재 여부 불명확

**권장사항**:
- `npm audit` CI/CD에 통합
- Snyk, Dependabot 같은 도구 사용
- 정기적인 보안 업데이트

---

## 7. 권장사항 요약

### 🔴 즉시 수정 필요 (Critical)

1. **CORS 정책 강화** - 특정 출처만 허용
2. **인증 메커니즘 추가** - 최소한 Basic Auth 구현
3. **localhost 바인딩** - 외부 노출 방지
4. **민감한 정보 노출 최소화** - 호스트명 등 제거

### 🟠 조속히 수정 권장 (High)

1. **XSS 방어** - `innerHTML` 대신 `textContent` 사용
2. **HTML 이스케이프** - 모든 동적 컨텐츠 검증
3. **Rate Limiting** - API 요청 제한 구현

### 🟡 개선 권장 (Medium)

1. **SRI 해시 추가** - CDN 리소스 무결성 검증
2. **에러 처리 개선** - 사용자 피드백 및 복구 로직
3. **환경 설정 분리** - `.env` 파일 사용
4. **메모리 관리** - 데이터 저장소 외부화

### 🔵 장기 개선 과제 (Low)

1. **TypeScript 마이그레이션**
2. **테스트 코드 작성**
3. **아키텍처 리팩토링**
4. **WebSocket 도입**
5. **모니터링 및 로깅 시스템**

---

## 보안 체크리스트

```
[ ] CORS 정책 설정
[ ] 인증/인가 구현
[ ] XSS 방어 (HTML 이스케이프)
[ ] CSRF 방어
[ ] SQL Injection 방어 (해당 없음 - DB 미사용)
[ ] Rate Limiting
[ ] Input Validation
[ ] Output Encoding
[ ] Secure Headers (CSP, HSTS 등)
[ ] 민감한 정보 마스킹
[ ] 에러 메시지 일반화
[ ] 의존성 보안 점검
[ ] HTTPS 적용 (프로덕션)
[ ] 로깅 및 모니터링
[ ] 정기 보안 감사
```

---

## 코드 품질 체크리스트

```
[ ] 일관된 코드 스타일 (ESLint, Prettier)
[ ] 타입 안정성 (TypeScript/JSDoc)
[ ] 단위 테스트
[ ] 통합 테스트
[ ] 에러 처리
[ ] 로깅
[ ] 문서화 (README, API 문서)
[ ] 코드 리뷰 프로세스
[ ] CI/CD 파이프라인
[ ] 성능 테스트
```

---

## 결론

이 프로젝트는 시스템 모니터링의 기본 기능은 잘 구현되어 있으나, **보안 측면에서 심각한 취약점**이 다수 존재합니다. 특히:

1. **무제한 CORS** - 가장 심각한 보안 위험
2. **인증 부재** - 누구나 시스템 정보 접근 가능
3. **XSS 취약점** - 악의적인 스크립트 실행 가능
4. **민감 정보 노출** - 시스템 지문 수집 가능

**현재 상태로는 프로덕션 환경에 배포 불가**하며, 최소한 Critical 및 High 등급 문제를 해결한 후 사용해야 합니다.

개발 목적 또는 완전히 격리된 로컬 환경에서만 사용을 권장합니다.

---

**리뷰 종료**

문의사항이나 추가 설명이 필요한 부분이 있다면 알려주시기 바랍니다.
