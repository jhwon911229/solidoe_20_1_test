# TripSync Setup Guide

완전한 TripSync 애플리케이션 설정 가이드입니다.

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [PostgreSQL 설정](#postgresql-설정)
3. [Redis 설정](#redis-설정)
4. [Google Maps API 키 발급](#google-maps-api-키-발급)
5. [Backend 설정](#backend-설정)
6. [Frontend 설정](#frontend-설정)
7. [Recommendation Engine 설정](#recommendation-engine-설정)
8. [전체 시스템 실행](#전체-시스템-실행)
9. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 1. Node.js 설치
```bash
# Node.js 16.x 이상 설치
# https://nodejs.org/

# 설치 확인
node --version  # v16.0.0 이상
npm --version   # 8.0.0 이상
```

### 2. Python 설치
```bash
# Python 3.9 이상 설치
# https://www.python.org/

# 설치 확인
python --version  # Python 3.9.0 이상
pip --version
```

### 3. Git 설치
```bash
# Git 설치
# https://git-scm.com/

# 설치 확인
git --version
```

---

## PostgreSQL 설정

### 1. PostgreSQL 설치

#### macOS (Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
[PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 설치 프로그램 다운로드

### 2. 데이터베이스 생성
```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE tripsync_db;
CREATE USER tripsync_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tripsync_db TO tripsync_user;

# 종료
\q
```

### 3. 연결 테스트
```bash
psql -h localhost -U tripsync_user -d tripsync_db
```

---

## Redis 설정

### 1. Redis 설치

#### macOS (Homebrew)
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Windows
[Redis for Windows](https://github.com/microsoftarchive/redis/releases) 다운로드

### 2. Redis 테스트
```bash
redis-cli ping
# 응답: PONG
```

---

## Google Maps API 키 발급

### 1. Google Cloud Console 접속
[Google Cloud Console](https://console.cloud.google.com/) 방문

### 2. 프로젝트 생성
- 새 프로젝트 생성 또는 기존 프로젝트 선택

### 3. API 활성화
다음 API들을 활성화:
- **Maps JavaScript API**
- **Directions API**
- **Places API**
- **Geocoding API**

### 4. API 키 생성
- 사용자 인증 정보 > API 키 생성
- API 키 제한 설정 (권장)

### 5. API 키 저장
나중에 `.env` 파일에 사용할 API 키를 안전하게 보관

---

## Backend 설정

### 1. 디렉토리 이동 및 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일 편집
nano .env  # 또는 원하는 에디터 사용
```

`.env` 파일 내용:
```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tripsync_db
DB_USER=tripsync_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_very_secure_random_string_here_min_32_chars
JWT_EXPIRE=7d

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Recommendation Service
RECOMMENDATION_SERVICE_URL=http://localhost:8000
```

### 3. 데이터베이스 초기화
```bash
# 개발 모드로 서버 실행 (자동으로 테이블 생성)
npm run dev
```

서버가 정상적으로 시작되면 다음 메시지가 표시됩니다:
```
✓ Database connection established successfully
✓ Database models synchronized
✓ Redis client connected
✓ TripSync Backend running on port 5000
✓ GraphQL endpoint: http://localhost:5000/graphql
```

### 4. GraphQL Playground 테스트
브라우저에서 `http://localhost:5000/graphql` 접속

테스트 쿼리:
```graphql
{
  __schema {
    types {
      name
    }
  }
}
```

---

## Frontend 설정

### 1. 디렉토리 이동 및 의존성 설치
```bash
cd frontend
npm install
```

### 2. React Native 환경 설정

#### iOS (Mac only)
```bash
# CocoaPods 설치
sudo gem install cocoapods

# iOS 의존성 설치
cd ios
pod install
cd ..
```

#### Android
- Android Studio 설치
- Android SDK 설정
- 환경 변수 설정 (ANDROID_HOME)

### 3. 개발 서버 실행
```bash
# Metro bundler 시작
npm start
```

### 4. 앱 실행

새 터미널에서:

```bash
# iOS 실행 (Mac only)
npm run ios

# Android 실행
npm run android
```

---

## Recommendation Engine 설정

### 1. 디렉토리 이동
```bash
cd recommendation
```

### 2. 가상환경 생성 (권장)
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. 서버 실행
```bash
cd src
python main.py
```

서버가 정상적으로 시작되면:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### 5. API 문서 확인
브라우저에서 `http://localhost:8000/docs` 접속

---

## 전체 시스템 실행

### 1. 터미널 1: Backend
```bash
cd backend
npm run dev
```

### 2. 터미널 2: Recommendation Engine
```bash
cd recommendation
source venv/bin/activate  # 가상환경 활성화
cd src
python main.py
```

### 3. 터미널 3: Frontend Metro
```bash
cd frontend
npm start
```

### 4. 터미널 4: Frontend App
```bash
cd frontend
npm run ios  # 또는 npm run android
```

---

## 문제 해결

### PostgreSQL 연결 실패
```bash
# PostgreSQL 서비스 상태 확인
# macOS:
brew services list

# Linux:
sudo systemctl status postgresql

# 재시작
# macOS:
brew services restart postgresql

# Linux:
sudo systemctl restart postgresql
```

### Redis 연결 실패
```bash
# Redis 서비스 상태 확인
# macOS:
brew services list

# Linux:
sudo systemctl status redis-server

# 재시작
# macOS:
brew services restart redis

# Linux:
sudo systemctl restart redis-server
```

### Node.js 모듈 에러
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### React Native 빌드 실패

#### iOS
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

#### Android
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Python 패키지 설치 실패
```bash
# pip 업그레이드
pip install --upgrade pip

# 캐시 삭제 후 재설치
pip cache purge
pip install -r requirements.txt
```

### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인 및 종료
# macOS/Linux:
lsof -ti:5000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 개발 팁

### Hot Reload 활성화
- Backend: `nodemon`이 자동으로 변경사항 감지
- Frontend: Metro bundler가 자동으로 리로드
- Python: FastAPI의 `reload=True` 옵션 활성화

### 디버깅

#### Backend
```javascript
// console.log 사용
console.log('Debug:', variable);

// VS Code 디버거 설정
// .vscode/launch.json
```

#### Frontend
```javascript
// React Native Debugger 사용
// Chrome DevTools
// console.log
```

#### Python
```python
# print 문 사용
print(f"Debug: {variable}")

# pdb 디버거
import pdb; pdb.set_trace()
```

### 성능 모니터링
```bash
# Backend
npm install -g clinic
clinic doctor -- node src/index.js

# Frontend
# React DevTools Profiler 사용
```

---

## 다음 단계

1. ✅ 모든 서비스 정상 실행 확인
2. 📱 모바일 앱에서 회원가입/로그인
3. 🗺️ 첫 여행 계획 생성
4. 🔍 추천 기능 테스트
5. 💰 예산 관리 기능 확인

---

## 추가 리소스

- [API 문서](./API_DOCUMENTATION.md)
- [프로젝트 README](../TRIPSYNC_README.md)
- [GraphQL 문서](https://graphql.org/)
- [React Native 문서](https://reactnative.dev/)
- [FastAPI 문서](https://fastapi.tiangolo.com/)

---

문제가 계속되면 GitHub Issues에 보고해주세요!
