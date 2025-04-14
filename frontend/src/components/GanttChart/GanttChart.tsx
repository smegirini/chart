import React, { useEffect, useRef } from 'react';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { gantt } from 'dhtmlx-gantt';
import './GanttChart.css'; // Import custom CSS
import { Task, GanttTask, GanttLink } from '../../types'; // Ensure Task is imported
import moment from 'moment'; // Import moment for date formatting

interface GanttProps {
  tasks: {
    data: any[]; // Use any[] temporarily to avoid complex type conflicts with dhtmlx-gantt internal types
    links: GanttLink[];
  };
  onTaskUpdate?: (id: number | string, task: Partial<Task>) => void; // Use Partial<Task> for update data
  viewMode?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  categories?: { id: number; name: string }[]; // Optional category data for column template
  stages?: { id: number; name: string }[];     // Optional stage data for column template
  statuses?: { id: number; name: string; color: string }[]; // Add statuses for tooltip
}

const GanttChart: React.FC<GanttProps> = ({ 
  tasks, 
  onTaskUpdate, 
  viewMode = 'month', 
  categories = [], // Default to empty array
  stages = [],       // Default to empty array
  statuses = []      // Add statuses prop
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    // --- Gantt Configuration --- //
    gantt.config.date_format = "%Y-%m-%d"; // Match backend date format
    gantt.config.xml_date = "%Y-%m-%d";    // Ensure data parsing uses the same format
    gantt.config.readonly = false; // Allow editing by default
    gantt.config.autosize = "y"; // Adjust height automatically
    gantt.config.fit_tasks = true; // Adjust timescale to fit all tasks
    gantt.config.grid_width = 450; // Adjust grid width as needed

    // Define columns
    gantt.config.columns = [
      { name: "text", label: "설비명", width: 200, tree: true, resize: true },
      {
        name: "category_id", label: "Category", width: 100, align: "center", resize: true,
        template: (obj: any) => categories.find(c => c.id === obj.category_id)?.name || '' // Use any for obj
      },
      {
        name: "stage_id", label: "단계", width: 80, align: "center", resize: true,
        template: (obj: any) => stages.find(s => s.id === obj.stage_id)?.name || '' // Use any for obj
      },
      {
        name: "start_date", label: "시작일", width: 100, align: "center", resize: true,
        template: (obj: any) => obj.start_date ? moment(obj.start_date).format('YYYY-MM-DD') : '' // Use any for obj
      },
      {
        name: "end_date", label: "종료일", width: 100, align: "center", resize: true,
        template: (obj: any) => obj.end_date ? moment(obj.end_date).format('YYYY-MM-DD') : '' // Use any for obj
      },
      {
        name: "progress", label: "진행률", width: 80, align: "center", resize: true,
        template: (obj: any) => obj.progress != null ? Math.round(obj.progress * 100) + "%" : '0%' // Use any for obj
      },
      // Add duration column if needed
      // { name: "duration", label: "기간", width: 60, align: "center" },
      { name: "add", width: 44 } // '+' column for adding tasks
    ];

    // Task styling based on status_id
    gantt.templates.task_class = (start, end, task: any): string => { // Use any for task
      switch (task.status_id) {
        case 1: return "task-status-pending";
        case 2: return "task-status-progress";
        case 3: return "task-status-completed";
        default: return "";
      }
    };

    // Task text template (can customize)
    gantt.templates.task_text = (start, end, task: any): string => { // Use any for task
        return task.text;
    };

    // Tooltip template
    gantt.templates.tooltip_text = (start, end, task: any): string => { // Use any for task
        const category = categories.find(c => c.id === task.category_id)?.name || 'N/A';
        const stage = stages.find(s => s.id === task.stage_id)?.name || 'N/A';
        // Find status name using the statuses prop
        const status = statuses.find(st => st.id === task.status_id)?.name || 'N/A'; 
        return `<b>${task.text}</b><br/>
                Category: ${category}<br/>
                단계: ${stage}<br/>
                상태: ${status}<br/>
                시작: ${moment(start).format('YYYY-MM-DD')}<br/>
                종료: ${moment(end).format('YYYY-MM-DD')}<br/>
                진행률: ${Math.round(task.progress * 100)}%`;
    };

    // Configure scales based on viewMode
    switch (viewMode) {
      case 'day':
        gantt.config.scale_unit = 'day';
        gantt.config.step = 1;
        gantt.config.date_scale = '%Y-%m-%d'; // More precise daily scale
        gantt.config.subscales = [{ unit: "hour", step: 6, date: "%H:%i" }]; // Show hours
        gantt.config.scale_height = 50;
        break;
      case 'week':
        gantt.config.scale_unit = 'week';
        gantt.config.step = 1;
        gantt.config.date_scale = 'Week #%W, %Y';
        gantt.config.subscales = [{ unit: "day", step: 1, date: "%D, %d" }]; // Show days
        gantt.config.scale_height = 50;
        break;
      case 'month':
        gantt.config.scale_unit = 'month';
        gantt.config.step = 1;
        gantt.config.date_scale = '%F, %Y'; // Full month name
        gantt.config.subscales = [{ unit: "week", step: 1, date: "Week #%W" }]; // Show weeks
        gantt.config.scale_height = 50;
        break;
      case 'quarter':
        gantt.config.scale_unit = 'quarter';
        gantt.config.step = 1;
        gantt.config.date_scale = 'Quarter #%q, %Y';
        gantt.config.subscales = [{ unit: "month", step: 1, date: "%M" }]; // Show months
        gantt.config.scale_height = 50;
        break;
      case 'year':
        gantt.config.scale_unit = 'year';
        gantt.config.step = 1;
        gantt.config.date_scale = '%Y';
        gantt.config.subscales = [{ unit: "quarter", step: 1, date: "Q%q" }]; // Show quarters
        gantt.config.scale_height = 50;
        break;
      default:
        gantt.config.scale_unit = 'month';
        gantt.config.date_scale = '%F, %Y';
        gantt.config.subscales = [{ unit: "week", step: 1, date: "Week #%W" }];
        gantt.config.scale_height = 50;
    }

    // --- Event Handlers --- //
    const onAfterTaskUpdate = gantt.attachEvent("onAfterTaskUpdate", (id, task: any) => { // Use any for task
      if (onTaskUpdate) {
        // Convert gantt task back to our Task format for the backend update
        const updatedTaskData: Partial<Task> = {
          // Map fields from gantt task object (task) to our Task interface
          name: task.text,
          start_date: moment(task.start_date).format('YYYY-MM-DD'),
          end_date: moment(task.end_date).format('YYYY-MM-DD'),
          progress: Math.round(task.progress * 100), // Convert back to 0-100
          category_id: task.category_id, // Assume these exist on the gantt task object
          process_type_id: task.process_type_id,
          stage_id: task.stage_id,
          status_id: task.status_id,
          // We don't typically update actual dates or created/updated times via drag/resize
        };
        // Ensure id is number if backend expects number
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (!isNaN(numericId)) {
          onTaskUpdate(numericId, updatedTaskData);
        } else {
           console.error("Invalid task ID received from Gantt update:", id);
        }
      }
    });

    // Add handlers for link updates/creation/deletion if needed
    // const onAfterLinkAdd = gantt.attachEvent("onAfterLinkAdd", (id, link) => { ... });
    // const onAfterLinkUpdate = gantt.attachEvent("onAfterLinkUpdate", (id, link) => { ... });
    // const onAfterLinkDelete = gantt.attachEvent("onAfterLinkDelete", (id) => { ... });

    // Initialize Gantt
    gantt.init(containerRef.current);
    gantt.parse(tasks); // Load data

    // Cleanup function
    return () => {
      gantt.detachEvent(onAfterTaskUpdate);
      // Detach other events if added
      // gantt.detachEvent(onAfterLinkAdd);
      // gantt.detachEvent(onAfterLinkUpdate);
      // gantt.detachEvent(onAfterLinkDelete);
      gantt.clearAll(); // Clear gantt instance on component unmount
    };
  }, [tasks, onTaskUpdate, viewMode, categories, stages, statuses]); // Add statuses to dependency array

  return (
    <div ref={containerRef} style={{ width: '100%', height: '600px' }} /> // Increase default height
  );
};

export default GanttChart;
