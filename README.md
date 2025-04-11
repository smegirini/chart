# 맞춤형 웹 기반 일정 관리 시스템

이 프로젝트는 React, Node.js, TypeScript, MariaDB, Docker를 사용하여 구축된 웹 기반 일정 관리 시스템입니다.
간트 차트와 작업 목록 뷰를 통해 프로젝트 일정을 시각적으로 관리하고 추적할 수 있습니다.

## 기술 스택

*   **프론트엔드:**
    *   React (Create React App)
    *   TypeScript
    *   Ant Design (UI 라이브러리)
    *   dhtmlx-gantt (간트 차트 라이브러리)
    *   Axios (HTTP 클라이언트)
    *   Recharts (대시보드 차트)
    *   Moment.js (날짜/시간 처리)
*   **백엔드:**
    *   Node.js
    *   Express
    *   TypeScript
    *   MySQL2 (MariaDB 드라이버)
    *   dotenv (환경 변수 관리)
*   **데이터베이스:**
    *   MariaDB (10.6)
*   **개발/배포 환경:**
    *   Docker
    *   Docker Compose
    *   ts-node-dev (개발 시 TypeScript 실행 및 자동 재시작)

## 프로젝트 구조

```
.
├── docker-compose.yml      # Docker Compose 설정 파일
├── frontend/               # 프론트엔드 (React) 프로젝트
│   ├── Dockerfile          # 프론트엔드 Docker 이미지 빌드 설정
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   └── src/
│       ├── components/     # 재사용 가능한 UI 컴포넌트
│       │   ├── GanttChart/
│       │   ├── TaskList/
│       │   ├── FilterPanel/
│       │   └── Dashboard/
│       ├── services/       # API 호출 서비스 (api.ts)
│       ├── types/          # TypeScript 타입 정의 (index.ts)
│       ├── App.css
│       ├── App.tsx         # 메인 애플리케이션 컴포넌트
│       └── index.tsx       # 애플리케이션 진입점
├── backend/                # 백엔드 (Node.js/Express) 프로젝트
│   ├── Dockerfile          # 백엔드 Docker 이미지 빌드 설정
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── controllers/    # 요청 처리 로직 (taskController.ts 등)
│       ├── models/         # (현재 사용 안 함, 필요시 추가)
│       ├── routes/         # API 라우트 정의 (taskRoutes.ts 등)
│       ├── services/       # (현재 사용 안 함, 필요시 추가)
│       ├── utils/          # (현재 사용 안 함, 필요시 추가)
│       ├── config/         # 설정 파일 (db.ts)
│       ├── app.ts          # Express 앱 설정
│       └── index.ts        # 서버 진입점
└── database/               # 데이터베이스 관련 파일
    └── init.sql          # 데이터베이스 스키마 및 초기 데이터
```

## 설치 및 실행 방법

### 요구 사항

*   Docker
*   Docker Compose

### 실행

1.  이 프로젝트 리포지토리를 클론하거나 다운로드합니다.
2.  프로젝트 루트 디렉토리에서 터미널을 엽니다.
3.  다음 명령어를 실행하여 Docker 이미지를 빌드하고 모든 서비스(데이터베이스, 백엔드, 프론트엔드) 컨테이너를 시작합니다:

    ```bash
    docker-compose up --build
    ```

4.  빌드 및 초기화가 완료될 때까지 기다립니다. 터미널 로그를 통해 각 서비스가 정상적으로 시작되었는지 확인할 수 있습니다.
    *   DB: `ready for connections`
    *   Backend: `Database connected successfully!`, `Backend server is running on http://localhost:4000`
    *   Frontend: `Compiled successfully!`
5.  웹 브라우저를 열고 `http://localhost:3000` 주소로 접속합니다.

### 중지

애플리케이션 실행을 중지하려면 터미널에서 `Ctrl + C`를 누르거나, 백그라운드에서 실행 중인 경우 다음 명령어를 사용합니다:

```bash
docker-compose down
```

데이터베이스 데이터를 포함하여 모든 컨테이너와 볼륨을 완전히 삭제하려면 다음 명령어를 사용합니다 (주의: 데이터 영구 삭제):

```bash
docker-compose down -v
```

## 사용 방법

1.  **접속:** 웹 브라우저에서 `http://localhost:3000` 으로 접속합니다.
2.  **탭:**
    *   **대시보드:** 전체 작업 현황, 진행률, 상태별 분포를 시각적으로 확인합니다.
    *   **간트 차트:** 작업을 시간 축 상에서 시각화하고, 드래그 앤 드롭으로 일정을 수정합니다.
    *   **작업 목록:** 표 형태로 작업을 보고, 추가/수정/삭제합니다.
3.  **필터:** 좌측 사이드바에서 Category, Process Type, 단계, 상태, 기간별로 데이터를 필터링합니다.
4.  **데이터 저장:** 모든 변경 사항은 자동으로 데이터베이스에 저장됩니다.

## 향후 개발 방향 (추가 기능 제안)

*   사용자 인증 시스템 (JWT)
*   작업 의존성(Link) 관리 기능 추가 (간트 차트 연동)
*   상세 필터링 기능 강화
*   알림 시스템 (기한 임박, 지연 등)
*   PDF/Excel 내보내기 기능
*   다국어 지원
*   모바일 반응형 UI 개선 