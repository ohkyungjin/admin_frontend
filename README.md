# Cielo Pet Admin Frontend

반려동물 장례식장 관리 시스템의 프론트엔드 프로젝트입니다.

## 기술 스택

- React 19.0.0
- React Router DOM 7.1.4
- Redux Toolkit 2.5.1
- Tailwind CSS 3.3.0
- Axios 1.7.9
- Headless UI 2.2.0
- Hero Icons 2.2.0

## 시작하기

### 필수 조건

- Node.js 18.0.0 이상
- npm 9.0.0 이상

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/ohkyungjin/admin_frontend.git
cd admin_frontend
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm start
```

## 주요 기능

- 재고 관리
  - 품목 등록/수정/삭제
  - 재고 수량 조정 (입고/출고)
  - 최소/최대 재고 관리
  - 부족 재고 알림

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## 의존성 목록

### 프로덕션 의존성
```json
{
  "@headlessui/react": "^2.2.0",
  "@heroicons/react": "^2.2.0",
  "@reduxjs/toolkit": "^2.5.1",
  "@tanstack/react-query": "^5.65.1",
  "axios": "^1.7.9",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-redux": "^9.2.0",
  "react-router-dom": "^7.1.4",
  "react-scripts": "5.0.1",
  "web-vitals": "^4.2.4"
}
```

### 개발 의존성
```json
{
  "autoprefixer": "^10.4.14",
  "postcss": "^8.4.31",
  "tailwindcss": "^3.3.0"
}
```
