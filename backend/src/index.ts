import app from './app';
import dotenv from 'dotenv';
import { loadReferenceData } from './controllers/taskController';

dotenv.config(); // Ensure environment variables are loaded

const PORT = process.env.PORT || 4000;

// 서버 시작 전 초기화 작업을 수행하는 async IIFE
(async () => {
  try {
    // 이름-ID 변환을 위한 참조 데이터 로드
    await loadReferenceData(); 
    console.log('참조 데이터 로딩 완료 (from index.ts).');

    // 참조 데이터 로드 성공 후 서버 시작
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('애플리케이션 초기화 실패:', error);
    process.exit(1); // 초기화 실패 시 프로세스 종료
  }
})(); 