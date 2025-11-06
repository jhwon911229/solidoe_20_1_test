# TripSync - 개인 맞춤형 여행 플래너 앱

<div align="center">

**사용자의 출발지, 목적지, 여행기간, 예산 정보를 기반으로 최적의 여행 루트와 추천지를 제공하는 통합 여행 개인화 애플리케이션**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/react--native-0.72-blue.svg)](https://reactnative.dev/)
[![Python](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)

</div>

---

## 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [시스템 아키텍처](#시스템-아키텍처)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [API 문서](#api-문서)
- [스크린샷](#스크린샷)
- [기대효과](#기대효과)
- [향후 계획](#향후-계획)
- [기여하기](#기여하기)
- [라이센스](#라이센스)

---

## 개요

TripSync는 여행자들이 효율적이고 즐거운 여행을 계획할 수 있도록 돕는 AI 기반 여행 플래너 애플리케이션입니다. 사용자의 취향, 예산, 일정에 맞춰 최적의 여행 코스를 추천하고, 실시간 교통 정보를 제공하며, 예산 관리를 지원합니다.

### 핵심 가치

- **개인화**: AI 기반 협업 필터링으로 사용자 맞춤 추천
- **최적화**: 예산 제약 조건 내에서 가치 극대화
- **편의성**: 원스톱 여행 계획 및 관리
- **실시간**: 실시간 교통 정보 및 경로 안내

---

## 주요 기능

### 1. 경로 입력 및 관리
- 출발지/도착지 검색 및 선택
- 여행 기간 설정 (시작일/종료일)
- 동행 인원 수 입력
- 예산 설정 및 통화 선택

### 2. 실시간 교통 연계
- **다양한 교통수단 지원**: 자동차, 도보, 버스, 기차, 비행기
- **실시간 경로 계산**: Google Maps API 기반
- **교통수단 비교**: 소요시간, 비용, 거리 비교
- **최적 경로 추천**: 사용자 우선순위 기반 (빠름/저렴/균형)

### 3. 지도 시각화
- **구글맵 통합**: 실시간 지도 표시
- **경로 시각화**: 폴리라인으로 이동 경로 표시
- **마커 표시**: 출발지, 목적지, 추천 장소
- **인터랙티브 UI**: 교통수단 선택 버튼

### 4. 개인 맞춤 추천
- **AI 협업 필터링**: 사용자 취향 기반 추천
- **다양한 카테고리**:
  - 맛집 (레스토랑, 카페)
  - 관광 명소 (박물관, 사찰, 해변)
  - 숙소 (호텔, 게스트하우스, 호스텔)
  - 액티비티 (등산, 투어, 스파)
- **추천 점수 시스템**: 0-1 스케일의 정확한 점수
- **필터링**: 예산, 취향, 여행 스타일 기반

### 5. 예산 관리
- **자동 예산 배분**: 숙박, 식사, 교통, 액티비티
- **실시간 예산 추적**: 현재 지출 vs 총 예산
- **예산 최적화**: 냅색 알고리즘 기반 가치 극대화
- **예산 분석 리포트**:
  - 카테고리별 지출 내역
  - 일별 예산 추천
  - 예산 활용률 (%)

### 6. 일정 요약 및 분석
- **여행 통계**:
  - 총 이동 거리 (km)
  - 총 소요 시간 (시간/분)
  - 총 예상 비용 (₩)
- **교통수단별 분석**: 거리, 시간, 비용
- **일별 일정표**: 시간대별 활동 계획
- **비교 분석**: 여러 경로 옵션 비교

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│                  (React Native Mobile App)                   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Home    │  │  Create  │  │   Map    │  │  Budget  │  │
│  │  Screen  │  │   Trip   │  │  Screen  │  │  Screen  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
                    Redux State Management
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                            │
│              (Node.js + Express + GraphQL)                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   GraphQL    │  │     REST     │  │  Services    │     │
│  │   Resolvers  │  │      API     │  │   Layer      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
           ↓ ↑                    ↓ ↑              ↓ ↑
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │  Google Maps API │  │  Python ML      │
│    Database     │  │  Skyscanner API  │  │  Recommender    │
│   + Redis Cache │  │  Weather API     │  │  (Port 8000)    │
└─────────────────┘  └──────────────────┘  └─────────────────┘
```

---

## 기술 스택

### Frontend (Mobile)
- **React Native** 0.72 - 크로스플랫폼 모바일 프레임워크
- **TypeScript** - 타입 안전성
- **Redux Toolkit** - 상태 관리
- **React Navigation** - 화면 내비게이션
- **React Native Maps** - 지도 통합
- **Axios** - HTTP 클라이언트

### Backend (Server)
- **Node.js** 16+ - JavaScript 런타임
- **Express** - 웹 프레임워크
- **GraphQL** - API 쿼리 언어
- **Sequelize** - ORM (Object-Relational Mapping)
- **JWT** - 인증 토큰

### Database
- **PostgreSQL** - 관계형 데이터베이스
- **Redis** - 캐싱 및 세션 관리

### AI/ML Engine (Recommendation)
- **Python** 3.9+ - 프로그래밍 언어
- **FastAPI** - 고성능 웹 프레임워크
- **NumPy** - 수치 연산
- **Pandas** - 데이터 처리
- **scikit-learn** - 머신러닝 알고리즘

### External APIs
- **Google Maps API** - 지도 및 경로 계산
- **Skyscanner API** - 항공권 정보 (계획)
- **Weather API** - 날씨 정보 (계획)

### Deployment
- **AWS Lambda** - 서버리스 함수
- **AWS S3** - 정적 파일 스토리지
- **CloudFront** - CDN

---

## 프로젝트 구조

```
tripsync/
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── config/            # Database, Redis 설정
│   │   ├── models/            # Sequelize 모델
│   │   ├── graphql/           # GraphQL 스키마 & 리졸버
│   │   ├── services/          # 비즈니스 로직
│   │   │   ├── routeService.js
│   │   │   ├── recommendationService.js
│   │   │   └── budgetService.js
│   │   ├── middleware/        # 인증 미들웨어
│   │   └── index.js           # 서버 엔트리포인트
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React Native Frontend
│   ├── src/
│   │   ├── screens/           # 화면 컴포넌트
│   │   │   ├── HomeScreen.js
│   │   │   ├── CreateTripScreen.js
│   │   │   └── MapScreen.js
│   │   ├── components/        # 재사용 컴포넌트
│   │   ├── redux/             # Redux 상태 관리
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   ├── services/          # API 클라이언트
│   │   ├── navigation/        # 내비게이션 설정
│   │   └── types/             # TypeScript 타입
│   └── package.json
│
├── recommendation/             # Python Recommendation Engine
│   ├── src/
│   │   ├── main.py            # FastAPI 서버
│   │   ├── algorithms/        # ML 알고리즘
│   │   │   ├── collaborative_filtering.py
│   │   │   └── budget_optimizer.py
│   │   └── models/            # Pydantic 모델
│   └── requirements.txt
│
├── docs/                       # 문서
│   └── API_DOCUMENTATION.md
│
└── shared/                     # 공유 타입 및 상수
    └── types/
```

---

## 설치 및 실행

### 사전 요구사항

- **Node.js** 16.0.0 이상
- **Python** 3.9 이상
- **PostgreSQL** 12 이상
- **Redis** 6 이상
- **Google Maps API Key**

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/tripsync.git
cd tripsync
```

### 2. Backend 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 및 API 키 설정

# 데이터베이스 마이그레이션
npm run migrate

# 서버 실행 (개발 모드)
npm run dev
```

Backend는 `http://localhost:5000`에서 실행됩니다.
GraphQL Playground: `http://localhost:5000/graphql`

### 3. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# iOS 실행 (Mac only)
npm run ios

# Android 실행
npm run android

# 개발 서버 시작
npm start
```

### 4. Recommendation Engine 설정

```bash
cd recommendation

# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
cd src
python main.py
```

Recommendation Engine은 `http://localhost:8000`에서 실행됩니다.
API 문서: `http://localhost:8000/docs`

### 5. 환경 변수 설정

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tripsync_db
DB_USER=postgres
DB_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret_key_here

GOOGLE_MAPS_API_KEY=your_google_maps_api_key

RECOMMENDATION_SERVICE_URL=http://localhost:8000
```

---

## API 문서

전체 API 문서는 [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)를 참조하세요.

### 주요 엔드포인트

#### GraphQL

- `POST /graphql` - GraphQL 쿼리 및 뮤테이션
- GraphQL Playground (개발 모드): `http://localhost:5000/graphql`

#### REST API

- `GET /health` - 서버 상태 확인
- `GET /api/transportation-options` - 교통 수단 옵션 조회
- `GET /api/nearby-places` - 근처 장소 조회

#### Recommendation API

- `POST /recommend` - 맞춤 추천 생성
- `POST /optimize-itinerary` - 일정 최적화
- FastAPI Docs: `http://localhost:8000/docs`

---

## 스크린샷

### 홈 화면
여행 목록을 보여주고 새로운 여행을 생성할 수 있습니다.

### 여행 생성 화면
출발지, 목적지, 날짜, 예산 등을 입력합니다.

### 지도 화면
Google Maps를 통해 경로를 시각화하고 교통수단을 선택합니다.

### 추천 화면
AI가 추천하는 맛집, 관광지, 숙소 등을 확인합니다.

### 예산 화면
예산 배분과 지출 현황을 그래프로 확인합니다.

---

## 기대효과

### 사용자 관점
- ✅ **시간 절약**: 여행 계획에 소요되는 시간 70% 감소
- ✅ **비용 최적화**: 예산 범위 내에서 최대 가치 실현
- ✅ **개인화**: 취향에 맞는 정확한 추천
- ✅ **편의성**: 모든 여행 정보를 한 곳에서 관리

### 비즈니스 관점
- 💡 **시장 차별화**: AI 기반 개인화 추천
- 💡 **수익 모델**: 제휴 마케팅, 프리미엄 기능
- 💡 **확장성**: 글로벌 시장 진출 가능
- 💡 **데이터 활용**: 여행 트렌드 분석

---

## 향후 계획

### Phase 2 (Q2 2024)
- [ ] SNS 공유 기능
- [ ] 사용자 리뷰 시스템
- [ ] 실시간 날씨 정보 통합
- [ ] 다국어 지원 (영어, 일본어, 중국어)

### Phase 3 (Q3 2024)
- [ ] AI 기반 자동 일정 생성
- [ ] 항공사/호텔 실시간 예약 연계
- [ ] 그룹 여행 기능
- [ ] 여행 일지 및 사진 앨범

### Phase 4 (Q4 2024)
- [ ] AR 기반 네비게이션
- [ ] 오프라인 모드
- [ ] 여행자 보험 연계
- [ ] 비즈니스 출장 모드

---

## 개발 가이드

### 코드 스타일
- **JavaScript/TypeScript**: ESLint + Prettier
- **Python**: Black + Flake8
- **Commit**: Conventional Commits

### 테스트
```bash
# Backend 테스트
cd backend
npm test

# Frontend 테스트
cd frontend
npm test

# Python 테스트
cd recommendation
pytest
```

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발
- `bugfix/*`: 버그 수정
- `hotfix/*`: 긴급 수정

---

## 기여하기

TripSync에 기여해주셔서 감사합니다!

1. 이 저장소를 Fork 합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 Commit 합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

---

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE.md](LICENSE.md)를 참조하세요.

---

## 팀 및 연락처

### 개발팀
- **Backend Developer**: [Your Name]
- **Frontend Developer**: [Your Name]
- **ML Engineer**: [Your Name]
- **UI/UX Designer**: [Your Name]

### 연락처
- **Email**: contact@tripsync.example.com
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/tripsync/issues)
- **Documentation**: [docs.tripsync.example.com]

---

## 감사의 말

- **Google Maps Platform** - 지도 및 경로 서비스
- **React Native Community** - 훌륭한 라이브러리들
- **FastAPI** - 고성능 Python 웹 프레임워크
- **Open Source Community** - 모든 기여자분들께 감사드립니다

---

<div align="center">

**⭐ 이 프로젝트가 마음에 드셨다면 Star를 눌러주세요! ⭐**

Made with ❤️ by TripSync Team

</div>
