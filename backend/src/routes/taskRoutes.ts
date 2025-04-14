import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
  bulkCreateTasks
} from '../controllers/taskController';

const router = express.Router();

// Helper for async routes
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Multer 설정 (파일 저장 위치 및 파일 이름 설정 등)
// uploads 디렉토리가 없으면 생성해야 합니다.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // 파일을 저장할 디렉토리
    },
    filename: function (req, file, cb) {
        // 파일 이름 중복 방지를 위해 타임스탬프 추가
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    // 파일 필터링 (예: CSV만 허용)
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('CSV 파일만 업로드 가능합니다.'));
        }
    }
});

router.get('/', asyncHandler(getAllTasks));
router.post('/', asyncHandler(createTask));
router.get('/:id', asyncHandler(getTaskById));
router.put('/:id', asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));

// 일괄 생성 라우트 추가
// 'file'은 프론트엔드에서 파일을 보낼 때 사용할 필드 이름입니다.
router.post('/bulk', upload.single('file'), asyncHandler(bulkCreateTasks));

export default router; 