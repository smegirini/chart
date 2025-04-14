export interface Task {
  id: number;
  name: string;
  category_id: number | null;
  process_type_id: number | null;
  stage_id: number | null;
  status_id: number | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  actual_start_date: string | null;
  actual_end_date: string | null;
  // Added fields (matching backend)
  spec: string | null;
  vendor: string | null;
  po_number: string | null;
  po_date: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  installation_start_date: string | null;
  installation_end_date: string | null;
  notes: string | null;
  // Relational fields (filled by JOINs from backend)
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
  created_at?: string;
}

export interface ProcessType {
  id: number;
  name: string;
  created_at?: string;
}

export interface Stage {
  id: number;
  name: string;
  created_at?: string;
}

export interface Status {
  id: number;
  name: string;
  color: string;
  created_at?: string;
}

export interface TaskDependency {
  id: number;
  predecessor_id: number;
  successor_id: number;
  dependency_type: string; // e.g., 'FS', 'FF', 'SS', 'SF'
  lag: number;
  created_at?: string;
}

// For Gantt chart data structure
export interface GanttTask extends Task {
  text: string;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  parent: number | string;
  type?: string; // e.g., 'task', 'project', 'milestone'
  open?: boolean;
}

export interface GanttLink {
  id: number | string; // Can be auto-generated string by gantt
  source: number; // predecessor task id
  target: number; // successor task id
  type: string; // e.g., '0' for FS, '1' for SS, '2' for FF, '3' for SF
  lag?: number;
}
