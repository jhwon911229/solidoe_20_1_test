# TripSync - 개인 맞춤형 여행 플래너 🌍✈️

**TripSync**는 사용자의 출발지, 목적지, 여행기간, 예산 정보를 기반으로 최적의 여행 루트와 추천지를 제공하는 통합 여행 개인화 애플리케이션입니다.

![TripSync](https://img.shields.io/badge/TripSync-Travel%20Planner-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 주요 기능 ✨

### 1. **여행 계획 만들기** 🗺️
- 출발지와 목적지 검색 (Google Places API)
- 여행 기간 및 예산 설정
- 여행 선호도 선택 (문화/자연/맛집/쇼핑/액티비티)
- 실시간 경로 계산 및 시각화

### 2. **지도 시각화** 🌐
- Google Maps 기반 경로 표시
- 실시간 거리 및 소요시간 계산
- 예상 이동 비용 산출
- 대화형 지도 인터페이스

### 3. **내 여행 관리** 🎒
- 생성된 여행 목록 관리
- 여행 상태 추적 (계획 중, 확정됨, 진행 중, 완료됨)
- 여행 세부 정보 조회

### 4. **맞춤 추천** ⭐
- 목적지 주변 맛집 추천
- 인기 관광 명소 추천
- 숙소 정보 제공
- 평점 및 가격 수준 표시

### 5. **예산 관리** 💰
- 총 예산 및 사용 예정 금액 추적
- 항목별 예산 분배 (교통, 숙박, 식사, 관광, 기타)
- 시각적 예산 차트
- 잔여 예산 실시간 계산

## 기술 스택 🛠️

### Frontend
- **HTML5**: 구조화된 마크업
- **CSS3**: 반응형 디자인, 그라데이션, 애니메이션
- **JavaScript (ES6+)**: 동적 인터랙션 및 API 통합

### Backend
- **Node.js**: 서버 런타임
- **Express.js**: REST API 서버
- **Axios**: HTTP 클라이언트

### APIs
- **Google Maps JavaScript API**: 지도 표시 및 경로 계산
- **Google Places API**: 장소 검색 및 자동완성
- **Google Directions API**: 경로 안내

## 설치 및 실행 🚀

### 1. 저장소 클론

```bash
git clone https://github.com/jhwon911229/solidoe_20_1_test.git
cd solidoe_20_1_test
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env` 파일에 Google Maps API 키가 이미 설정되어 있습니다:

```env
PORT=3000
GOOGLE_MAPS_API_KEY=AIzaSyAMGooquPgD4C4lNL9sEdKr--2DTCr8djk
NODE_ENV=development
```

### 4. 서버 실행

```bash
npm start
```

또는 개발 모드로 실행 (nodemon 사용):

```bash
npm run dev
```

### 5. 브라우저에서 접속

```
http://localhost:3000
```

## 프로젝트 구조 📁

```
tripsync/
├── public/                 # 프론트엔드 정적 파일
│   ├── css/
│   │   └── style.css      # 메인 스타일시트
│   ├── js/
│   │   └── app.js         # 메인 JavaScript 애플리케이션
│   └── index.html         # 메인 HTML 페이지
├── legacy/                # 기존 시스템 모니터 파일 (참고용)
├── server.js              # Express 서버 및 API 엔드포인트
├── package.json           # 프로젝트 메타데이터 및 의존성
├── .env                   # 환경 변수
└── README.md              # 프로젝트 문서
```

## API 엔드포인트 📡

### 여행 관리
- `GET /api/trips` - 모든 여행 목록 조회
- `GET /api/trips/:id` - 특정 여행 조회
- `POST /api/trips` - 새 여행 생성
- `PUT /api/trips/:id` - 여행 정보 수정
- `DELETE /api/trips/:id` - 여행 삭제

### 경로 계산
- `POST /api/routes/calculate` - 출발지와 목적지 간 경로 계산

### 추천
- `GET /api/recommendations` - 맞춤 추천 조회

### 장소 검색
- `GET /api/places/search` - 장소 검색
- `GET /api/places/:placeId` - 장소 상세 정보

### 기타
- `GET /api/config` - API 설정 조회
- `GET /api/health` - 서버 상태 확인

## 사용 방법 📖

### 1. 여행 계획 생성

1. **여행 계획** 탭에서 여행 제목 입력
2. 출발지와 목적지를 검색하여 선택
3. 출발일과 도착일 설정
4. 예산 입력 (슬라이더 또는 직접 입력)
5. 여행 선호도 선택
6. **"여행 경로 탐색"** 버튼 클릭

### 2. 지도에서 경로 확인

- 생성된 경로가 지도에 표시됩니다
- 거리, 소요시간, 예상 비용 확인 가능

### 3. 내 여행 관리

- **내 여행** 탭에서 생성된 여행 목록 확인
- 각 여행의 상태 및 세부 정보 조회

### 4. 추천 확인

- **추천** 탭에서 목적지 주변 맛집, 명소, 숙소 확인
- 필터를 사용하여 원하는 카테고리만 보기

### 5. 예산 관리

- **예산 관리** 탭에서 전체 예산 현황 확인
- 항목별 예산 분배 차트 조회

## 기능 시연 🎥

### 메인 화면
- 직관적인 네비게이션
- 그라데이션 배경과 현대적인 디자인

### 여행 계획 폼
- Google Places 자동완성 기능
- 실시간 예산 슬라이더
- 여행 선호도 체크박스

### 지도 시각화
- 실시간 경로 표시
- 출발지/목적지 마커
- 경로 정보 패널

## 향후 개발 계획 🔮

- [ ] 사용자 인증 및 프로필 관리
- [ ] AI 기반 일정 자동 생성
- [ ] 실시간 날씨 정보 통합
- [ ] 항공사/숙박 플랫폼 예약 연계
- [ ] SNS 공유 기능
- [ ] 사용자 리뷰 시스템
- [ ] 다국어 지원
- [ ] 모바일 앱 (React Native)
- [ ] 오프라인 모드

## 기여 방법 🤝

1. 저장소 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경 사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 라이선스 📄

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE.md](LICENSE.md) 파일을 참조하세요.

## 문의 및 지원 💬

문제가 발생하거나 질문이 있으시면 [Issues](https://github.com/jhwon911229/solidoe_20_1_test/issues) 페이지를 이용해주세요.

---

**Made with ❤️ by TripSync Team**
