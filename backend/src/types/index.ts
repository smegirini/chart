export interface Task {
  id: number;
  name: string;
  category_id: number | null;
  process_type_id: number | null;
  stage_id: number | null;
  status_id: number | null;
  start_date: string | null; // Consider using Date object if more manipulation is needed
  end_date: string | null;
  progress: number;
  actual_start_date: string | null;
  actual_end_date: string | null;
  // Added fields
  spec: string | null;
  vendor: string | null;
  po_number: string | null;
  po_date: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  installation_start_date: string | null;
  installation_end_date: string | null;
  notes: string | null;
  // Relational fields (filled by JOINs)
  category_name?: string;
  process_type_name?: string;
  stage_name?: string;
  status_name?: string;
  status_color?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface ProcessType {
  id: number;
  name: string;
  description?: string | null;
}

export interface Stage { // task_stages 테이블에 해당
  id: number;
  name: string;
  description?: string | null;
}

export interface Status { // task_statuses 테이블에 해당
  id: number;
  name: string;
  color: string;
  description?: string | null;
} 