import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// 라우트 임포트
import taskRoutes from './routes/taskRoutes';
import categoryRoutes from './routes/categoryRoutes';
import stageRoutes from './routes/stageRoutes';
import statusRoutes from './routes/statusRoutes';
import processTypeRoutes from './routes/processTypeRoutes';

dotenv.config();

const app = express();

// 미들웨어
app.use(cors()); // Enable CORS for all origins
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Support URL-encoded bodies

// 기본 API 경로 설정
const apiBasePath = '/api';

// 라우트 연결
app.use(`${apiBasePath}/tasks`, taskRoutes);
app.use(`${apiBasePath}/categories`, categoryRoutes);
app.use(`${apiBasePath}/stages`, stageRoutes);
app.use(`${apiBasePath}/statuses`, statusRoutes);
app.use(`${apiBasePath}/process-types`, processTypeRoutes);

// 기본 라우트 (테스트용)
app.get('/', (req, res) => {
  res.send('Schedule Management API is running!');
});

// 중앙 에러 처리 미들웨어 (예시)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Error Handler]:", err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});


export default app; 