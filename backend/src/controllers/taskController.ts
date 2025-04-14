import { Request, Response } from 'express';
import pool from '../config/db';
import { Task, Category, ProcessType, Stage, Status } from '../types'; // 필요한 타입 import
import fs from 'fs'; // 파일 시스템 모듈 import
import Papa from 'papaparse'; // papaparse import

// --- Helper: 데이터 로드 및 이름-ID 맵 생성 ---
// 애플리케이션 시작 시 또는 필요 시 호출하여 관련 데이터를 미리 로드합니다.
// 실제 애플리케이션에서는 별도 모듈이나 캐싱 전략을 사용하는 것이 좋습니다.
let categoriesMap: Map<string, number> = new Map();
let processTypesMap: Map<string, number> = new Map();
let stagesMap: Map<string, number> = new Map();
let statusesMap: Map<string, number> = new Map();

async function loadReferenceData() {
  try {
    const [categories] = await pool.query('SELECT id, name FROM categories');
    const [processTypes] = await pool.query('SELECT id, name FROM process_types');
    const [stages] = await pool.query('SELECT id, name FROM task_stages'); // 테이블명 확인!
    const [statuses] = await pool.query('SELECT id, name FROM task_statuses'); // 테이블명 확인!

    categoriesMap = new Map((categories as Category[]).map(c => [c.name.toLowerCase(), c.id]));
    processTypesMap = new Map((processTypes as ProcessType[]).map(pt => [pt.name.toLowerCase(), pt.id]));
    stagesMap = new Map((stages as Stage[]).map(s => [s.name.toLowerCase(), s.id]));
    statusesMap = new Map((statuses as Status[]).map(st => [st.name.toLowerCase(), st.id]));
    
    console.log('참조 데이터 로드 완료.');
  } catch (error) {
    console.error('참조 데이터 로딩 중 오류 발생:', error);
    // 오류 발생 시 기존 맵을 비우거나, 애플리케이션 실행을 중단하는 등의 처리가 필요할 수 있습니다.
  }
}

// 애플리케이션 시작 시 참조 데이터 로드 (index.ts 또는 app.ts 에서 호출 필요)
// 여기서는 컨트롤러 파일 상단에서 일단 호출합니다. (실제로는 개선 필요)
// loadReferenceData(); // 여기서 직접 호출 제거

// 모든 작업 가져오기
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    // Join process_types table as well and select all new fields
    const [rows] = await pool.query(`
      SELECT 
        t.*, 
        c.name as category_name, 
        pt.name as process_type_name, 
        s.name as stage_name, 
        st.name as status_name, 
        st.color as status_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN process_types pt ON t.process_type_id = pt.id
      LEFT JOIN task_stages s ON t.stage_id = s.id
      LEFT JOIN task_statuses st ON t.status_id = st.id
    `);
    
    // DB에서 가져온 row 타입을 Task[] 타입으로 명시적으로 변환
    const tasks: Task[] = (rows as any[]).map(row => ({
      ...row,
      // 날짜 필드가 DB에서 DATE 타입으로 오면 문자열로 변환될 수 있으므로 확인.
      // 필요하다면 여기서 moment 등을 사용하여 포맷팅할 수 있습니다.
      start_date: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : null,
      end_date: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : null,
      actual_start_date: row.actual_start_date ? new Date(row.actual_start_date).toISOString().split('T')[0] : null,
      actual_end_date: row.actual_end_date ? new Date(row.actual_end_date).toISOString().split('T')[0] : null,
      po_date: row.po_date ? new Date(row.po_date).toISOString().split('T')[0] : null,
      expected_delivery_date: row.expected_delivery_date ? new Date(row.expected_delivery_date).toISOString().split('T')[0] : null,
      actual_delivery_date: row.actual_delivery_date ? new Date(row.actual_delivery_date).toISOString().split('T')[0] : null,
      installation_start_date: row.installation_start_date ? new Date(row.installation_start_date).toISOString().split('T')[0] : null,
      installation_end_date: row.installation_end_date ? new Date(row.installation_end_date).toISOString().split('T')[0] : null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// 작업 생성
export const createTask = async (req: Request, res: Response) => {
  const { 
    name, 
    category_id, 
    process_type_id, 
    stage_id, 
    status_id, 
    start_date, 
    end_date, 
    progress,
    // Added fields
    spec,
    vendor,
    po_number,
    po_date,
    expected_delivery_date,
    actual_delivery_date,
    installation_start_date,
    installation_end_date,
    notes,
    actual_start_date, // 실제 시작/종료일도 생성 시 받을 수 있도록 추가
    actual_end_date
  } = req.body;

  // Basic validation (start_date, end_date는 이제 필수가 아닐 수 있음)
  if (!name) {
    return res.status(400).json({ message: 'Missing required field: name' });
  }
  
  // Convert empty strings or nulls to null for date fields to avoid DB errors
  const parseDate = (dateStr: string | null | undefined): string | null => {
      return dateStr ? dateStr : null;
  };

  try {
    const [result] = await pool.query(
      `INSERT INTO tasks 
       (name, category_id, process_type_id, stage_id, status_id, 
        start_date, end_date, progress, actual_start_date, actual_end_date,
        spec, vendor, po_number, po_date, expected_delivery_date, 
        actual_delivery_date, installation_start_date, installation_end_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        name, category_id || null, process_type_id || null, stage_id || null, status_id || 1, // status_id 기본값 1 (미진행)
        parseDate(start_date), parseDate(end_date), progress || 0, parseDate(actual_start_date), parseDate(actual_end_date),
        spec || null, vendor || null, po_number || null, parseDate(po_date), parseDate(expected_delivery_date), 
        parseDate(actual_delivery_date), parseDate(installation_start_date), parseDate(installation_end_date), notes || null
      ]
    );
    
    const insertId = (result as any).insertId;
    // Fetch the created task with joined data and all fields to return
    const [newTaskRows] = await pool.query(
      `SELECT t.*, c.name as category_name, pt.name as process_type_name, s.name as stage_name, st.name as status_name, st.color as status_color
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN process_types pt ON t.process_type_id = pt.id
       LEFT JOIN task_stages s ON t.stage_id = s.id
       LEFT JOIN task_statuses st ON t.status_id = st.id
       WHERE t.id = ?`, [insertId]
    );

    if ((newTaskRows as any[]).length > 0) {
       // DB에서 가져온 row 타입을 Task 타입으로 변환
       const createdTask: Task = {
         ...(newTaskRows as any[])[0],
         start_date: (newTaskRows as any[])[0].start_date ? new Date((newTaskRows as any[])[0].start_date).toISOString().split('T')[0] : null,
         end_date: (newTaskRows as any[])[0].end_date ? new Date((newTaskRows as any[])[0].end_date).toISOString().split('T')[0] : null,
         actual_start_date: (newTaskRows as any[])[0].actual_start_date ? new Date((newTaskRows as any[])[0].actual_start_date).toISOString().split('T')[0] : null,
         actual_end_date: (newTaskRows as any[])[0].actual_end_date ? new Date((newTaskRows as any[])[0].actual_end_date).toISOString().split('T')[0] : null,
         po_date: (newTaskRows as any[])[0].po_date ? new Date((newTaskRows as any[])[0].po_date).toISOString().split('T')[0] : null,
         expected_delivery_date: (newTaskRows as any[])[0].expected_delivery_date ? new Date((newTaskRows as any[])[0].expected_delivery_date).toISOString().split('T')[0] : null,
         actual_delivery_date: (newTaskRows as any[])[0].actual_delivery_date ? new Date((newTaskRows as any[])[0].actual_delivery_date).toISOString().split('T')[0] : null,
         installation_start_date: (newTaskRows as any[])[0].installation_start_date ? new Date((newTaskRows as any[])[0].installation_start_date).toISOString().split('T')[0] : null,
         installation_end_date: (newTaskRows as any[])[0].installation_end_date ? new Date((newTaskRows as any[])[0].installation_end_date).toISOString().split('T')[0] : null,
         created_at: new Date((newTaskRows as any[])[0].created_at).toISOString(),
         updated_at: new Date((newTaskRows as any[])[0].updated_at).toISOString(),
       };
       res.status(201).json(createdTask);
    } else {
      // Fallback if fetch fails
      res.status(500).json({ message: 'Failed to fetch created task' });
    }

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

// 작업 업데이트
export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    name, 
    category_id, 
    process_type_id, 
    stage_id, 
    status_id, 
    start_date, 
    end_date, 
    progress,
    actual_start_date,
    actual_end_date,
    // Added fields
    spec,
    vendor,
    po_number,
    po_date,
    expected_delivery_date,
    actual_delivery_date,
    installation_start_date,
    installation_end_date,
    notes
  } = req.body;

  // Basic validation (start_date, end_date는 이제 필수가 아닐 수 있음)
  if (!name) {
    return res.status(400).json({ message: 'Missing required field: name' });
  }
  
  // Convert empty strings or nulls to null for date fields
   const parseDate = (dateStr: string | null | undefined): string | null => {
      return dateStr ? dateStr : null;
  };

  try {
    const [result] = await pool.query(
      `UPDATE tasks 
       SET name = ?, category_id = ?, process_type_id = ?, stage_id = ?, 
           status_id = ?, start_date = ?, end_date = ?, progress = ?, 
           actual_start_date = ?, actual_end_date = ?, spec = ?, vendor = ?, 
           po_number = ?, po_date = ?, expected_delivery_date = ?, actual_delivery_date = ?, 
           installation_start_date = ?, installation_end_date = ?, notes = ?
       WHERE id = ?`, 
      [
        name, category_id || null, process_type_id || null, stage_id || null, status_id || null, 
        parseDate(start_date), parseDate(end_date), progress, 
        parseDate(actual_start_date), parseDate(actual_end_date), spec || null, vendor || null,
        po_number || null, parseDate(po_date), parseDate(expected_delivery_date), parseDate(actual_delivery_date),
        parseDate(installation_start_date), parseDate(installation_end_date), notes || null,
        id
      ]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found or no changes made' });
    }

    // Fetch the updated task with joined data and all fields to return
    const [updatedTaskRows] = await pool.query(
      `SELECT t.*, c.name as category_name, pt.name as process_type_name, s.name as stage_name, st.name as status_name, st.color as status_color
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN process_types pt ON t.process_type_id = pt.id
       LEFT JOIN task_stages s ON t.stage_id = s.id
       LEFT JOIN task_statuses st ON t.status_id = st.id
       WHERE t.id = ?`, [id]
    );

    if ((updatedTaskRows as any[]).length > 0) {
       // DB에서 가져온 row 타입을 Task 타입으로 변환
       const updatedTask: Task = {
         ...(updatedTaskRows as any[])[0],
         start_date: (updatedTaskRows as any[])[0].start_date ? new Date((updatedTaskRows as any[])[0].start_date).toISOString().split('T')[0] : null,
         end_date: (updatedTaskRows as any[])[0].end_date ? new Date((updatedTaskRows as any[])[0].end_date).toISOString().split('T')[0] : null,
         actual_start_date: (updatedTaskRows as any[])[0].actual_start_date ? new Date((updatedTaskRows as any[])[0].actual_start_date).toISOString().split('T')[0] : null,
         actual_end_date: (updatedTaskRows as any[])[0].actual_end_date ? new Date((updatedTaskRows as any[])[0].actual_end_date).toISOString().split('T')[0] : null,
         po_date: (updatedTaskRows as any[])[0].po_date ? new Date((updatedTaskRows as any[])[0].po_date).toISOString().split('T')[0] : null,
         expected_delivery_date: (updatedTaskRows as any[])[0].expected_delivery_date ? new Date((updatedTaskRows as any[])[0].expected_delivery_date).toISOString().split('T')[0] : null,
         actual_delivery_date: (updatedTaskRows as any[])[0].actual_delivery_date ? new Date((updatedTaskRows as any[])[0].actual_delivery_date).toISOString().split('T')[0] : null,
         installation_start_date: (updatedTaskRows as any[])[0].installation_start_date ? new Date((updatedTaskRows as any[])[0].installation_start_date).toISOString().split('T')[0] : null,
         installation_end_date: (updatedTaskRows as any[])[0].installation_end_date ? new Date((updatedTaskRows as any[])[0].installation_end_date).toISOString().split('T')[0] : null,
         created_at: new Date((updatedTaskRows as any[])[0].created_at).toISOString(),
         updated_at: new Date((updatedTaskRows as any[])[0].updated_at).toISOString(),
       };
      res.json(updatedTask);
    } else {
      // Fallback if fetch fails
       res.status(404).json({ message: 'Updated task not found after update' });
    }

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// 작업 삭제
export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json({ message: 'Task deleted successfully' }); // Use 200 OK or 204 No Content
  } catch (error) {
    console.error('Error deleting task:', error);
    // Handle potential foreign key constraints if dependencies exist
    if ((error as any).code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: 'Cannot delete task because it has dependencies.' });
    }
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

// 단일 작업 가져오기
export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Select all new fields
    const [rows] = await pool.query(
      `SELECT 
         t.*, 
         c.name as category_name, 
         pt.name as process_type_name, 
         s.name as stage_name, 
         st.name as status_name,
         st.color as status_color
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN process_types pt ON t.process_type_id = pt.id
       LEFT JOIN task_stages s ON t.stage_id = s.id
       LEFT JOIN task_statuses st ON t.status_id = st.id
       WHERE t.id = ?`,
      [id]
    );
    
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // DB에서 가져온 row 타입을 Task 타입으로 변환
    const task: Task = {
      ...(rows as any[])[0],
      start_date: (rows as any[])[0].start_date ? new Date((rows as any[])[0].start_date).toISOString().split('T')[0] : null,
      end_date: (rows as any[])[0].end_date ? new Date((rows as any[])[0].end_date).toISOString().split('T')[0] : null,
      actual_start_date: (rows as any[])[0].actual_start_date ? new Date((rows as any[])[0].actual_start_date).toISOString().split('T')[0] : null,
      actual_end_date: (rows as any[])[0].actual_end_date ? new Date((rows as any[])[0].actual_end_date).toISOString().split('T')[0] : null,
      po_date: (rows as any[])[0].po_date ? new Date((rows as any[])[0].po_date).toISOString().split('T')[0] : null,
      expected_delivery_date: (rows as any[])[0].expected_delivery_date ? new Date((rows as any[])[0].expected_delivery_date).toISOString().split('T')[0] : null,
      actual_delivery_date: (rows as any[])[0].actual_delivery_date ? new Date((rows as any[])[0].actual_delivery_date).toISOString().split('T')[0] : null,
      installation_start_date: (rows as any[])[0].installation_start_date ? new Date((rows as any[])[0].installation_start_date).toISOString().split('T')[0] : null,
      installation_end_date: (rows as any[])[0].installation_end_date ? new Date((rows as any[])[0].installation_end_date).toISOString().split('T')[0] : null,
      created_at: new Date((rows as any[])[0].created_at).toISOString(),
      updated_at: new Date((rows as any[])[0].updated_at).toISOString(),
    };
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
};

// --- 새로운 컨트롤러 함수: 일괄 작업 생성 ---
export const bulkCreateTasks = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
  }

  const filePath = req.file.path;
  const tasksToInsert: any[] = [];
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  let rowNumber = 1; // 헤더 제외하고 1부터 시작

  // 참조 데이터가 로드되지 않았으면 오류 반환
  if (categoriesMap.size === 0 || processTypesMap.size === 0 || stagesMap.size === 0 || statusesMap.size === 0) {
      // 파일 삭제 후 오류 반환
      try { fs.unlinkSync(filePath); } catch (err) { console.error("임시 파일 삭제 오류:", err); }
      return res.status(500).json({ message: '서버 오류: 참조 데이터를 로드할 수 없습니다.' });
  }

  const fileStream = fs.createReadStream(filePath);

  Papa.parse(fileStream, {
    header: true, // 첫 번째 행을 헤더로 사용
    skipEmptyLines: true,
    step: (results) => {
      const row = results.data as any;
      rowNumber++;
      const errorsForRow: string[] = [];

      // 1. 필수 필드 확인 (name)
      if (!row.name) {
        // 작은따옴표 문제를 해결하기 위해 템플릿 리터럴(백틱) 사용
        errorsForRow.push(`'name' 필드는 필수입니다.`); 
      }

      // 2. 이름-ID 변환 (존재하지 않으면 오류)
      const category_id = categoriesMap.get(row.category_name?.toLowerCase());
      const process_type_id = processTypesMap.get(row.process_type_name?.toLowerCase());
      const stage_id = stagesMap.get(row.stage_name?.toLowerCase());
      const status_id = statusesMap.get(row.status_name?.toLowerCase());

      if (row.category_name && category_id === undefined) errorsForRow.push(`존재하지 않는 Category: ${row.category_name}`);
      if (row.process_type_name && process_type_id === undefined) errorsForRow.push(`존재하지 않는 Process Type: ${row.process_type_name}`);
      if (row.stage_name && stage_id === undefined) errorsForRow.push(`존재하지 않는 단계: ${row.stage_name}`);
      if (row.status_name && status_id === undefined) errorsForRow.push(`존재하지 않는 상태: ${row.status_name}`);

      // 3. 날짜 형식 유효성 검사 (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const parseDate = (dateStr: string | null | undefined): string | null => {
          if (!dateStr) return null;
          if (dateRegex.test(dateStr) && !isNaN(new Date(dateStr).getTime())) {
              return dateStr;
          } else {
              errorsForRow.push(`잘못된 날짜 형식: ${dateStr}`);
              return null; // 오류 시 null 반환 또는 다른 처리
          }
      };
      
      const startDate = parseDate(row.start_date);
      const endDate = parseDate(row.end_date);
      const poDate = parseDate(row.po_date);
      const expectedDeliveryDate = parseDate(row.expected_delivery_date);
      const actualDeliveryDate = parseDate(row.actual_delivery_date);
      const installationStartDate = parseDate(row.installation_start_date);
      const installationEndDate = parseDate(row.installation_end_date);
      const actualStartDate = parseDate(row.actual_start_date);
      const actualEndDate = parseDate(row.actual_end_date);

      // 4. 진행률 유효성 검사 (0-100 숫자)
      let progress = parseInt(row.progress, 10);
      if (isNaN(progress) || progress < 0 || progress > 100) {
          progress = 0; // 기본값 0 또는 오류 처리
          // errorsForRow.push('진행률은 0과 100 사이의 숫자여야 합니다.'); // 필요 시 오류 추가
      }

      // 오류가 있으면 해당 행은 건너뛰고 오류 메시지 기록
      if (errorsForRow.length > 0) {
        errorCount++;
        // 오류 메시지를 string으로 합쳐서 push
        errors.push(`Row ${rowNumber}: ${errorsForRow.join(', ')}`); 
      } else {
        // 유효한 데이터만 tasksToInsert 배열에 추가 (순서 중요! INSERT 쿼리와 일치해야 함)
        tasksToInsert.push([
          row.name, category_id || null, process_type_id || null, stage_id || null, status_id || 1, // status_id 기본값 1
          startDate, endDate, progress,
          row.spec || null, row.vendor || null, row.po_number || null, poDate,
          expectedDeliveryDate, actualDeliveryDate, installationStartDate, installationEndDate,
          actualStartDate, actualEndDate, row.notes || null
        ]);
        successCount++;
      }
    },
    complete: async () => {
      // 파일 스트림 닫고 파일 삭제
      fileStream.close();
      try { fs.unlinkSync(filePath); } catch (err) { console.error("임시 파일 삭제 오류:", err); }

      if (tasksToInsert.length > 0) {
        try {
          // 단일 INSERT 쿼리로 일괄 삽입
          const placeholders = tasksToInsert.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
          const flatValues = tasksToInsert.flat(); // 중첩 배열을 1차원 배열로 펼침
          const sql = `INSERT INTO tasks (name, category_id, process_type_id, stage_id, status_id, start_date, end_date, progress, spec, vendor, po_number, po_date, expected_delivery_date, actual_delivery_date, installation_start_date, installation_end_date, actual_start_date, actual_end_date, notes) VALUES ${placeholders}`;
          
          await pool.query(sql, flatValues);

          res.json({
            message: `작업 일괄 추가 완료: 성공 ${successCount}건, 실패 ${errorCount}건.`,
            successCount,
            errorCount,
            errors // 실패한 행의 오류 메시지 포함
          });
        } catch (dbError) {
          console.error('Database bulk insert error:', dbError);
          res.status(500).json({ 
            message: '데이터베이스 저장 중 오류가 발생했습니다.', 
            successCount, 
            errorCount: errorCount + (tasksToInsert.length - successCount), // DB 오류 시 실패 건수 조정
            errors: [...errors, `DB Error: ${(dbError as Error).message}`] 
          });
        }
      } else {
        // 삽입할 데이터가 없는 경우 (모든 행이 오류였거나 빈 파일)
        res.status(400).json({
          message: '처리할 유효한 데이터가 없습니다.',
          successCount,
          errorCount,
          errors
        });
      }
    },
    error: (error) => {
      console.error('CSV 파싱 오류:', error);
      // 파일 스트림 닫고 파일 삭제
      fileStream.close();
      try { fs.unlinkSync(filePath); } catch (err) { console.error("임시 파일 삭제 오류:", err); }
      res.status(500).json({ message: `파일 처리 중 오류 발생: ${error.message}` });
    }
  }); // Papa.parse 호출 마무리
};

// loadReferenceData 함수를 export 하여 외부에서 호출 가능하게 함
export { loadReferenceData }; 