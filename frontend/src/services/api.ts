import axios from 'axios';
import { Task, Category, ProcessType, Stage, Status, TaskDependency } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL
});

// --- Task API --- //
export const fetchTasks = async (): Promise<Task[]> => {
  const response = await api.get('/tasks');
  return response.data;
};

export const createTask = async (newTaskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'process_type_name' | 'stage_name' | 'status_name' | 'status_color'>): Promise<Task> => {
  const response = await api.post('/tasks', newTaskData);
  return response.data;
};

export const updateTask = async (id: number, updatedData: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, updatedData);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

// --- Category API --- //
export const fetchCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

// --- Process Type API --- //
export const fetchProcessTypes = async (): Promise<ProcessType[]> => {
  const response = await api.get('/process-types');
  return response.data;
};

// --- Stage API --- //
export const fetchStages = async (): Promise<Stage[]> => {
  const response = await api.get('/stages');
  return response.data;
};

// --- Status API --- //
export const fetchStatuses = async (): Promise<Status[]> => {
  const response = await api.get('/statuses');
  return response.data;
};

// --- Task Dependency API (Example - Implement if needed) --- //
export const fetchTaskDependencies = async (): Promise<TaskDependency[]> => {
  // Assuming endpoint exists in backend
  // const response = await api.get('/task-dependencies');
  // return response.data;
  console.warn('fetchTaskDependencies API call is mocked');
  return []; // Mock data
};

// 일괄 작업 생성 API 호출
export const bulkCreateTasks = async (file: File): Promise<any> => { // 반환 타입은 백엔드 응답 구조에 맞게 조정 필요
  const formData = new FormData();
  formData.append('file', file); // 백엔드 upload.single('file')과 이름 일치

  const response = await api.post('/tasks/bulk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // 업로드 진행률 처리 등 추가 설정 가능
  });
  return response.data;
};

export default api; 