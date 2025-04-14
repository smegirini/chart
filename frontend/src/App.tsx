import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Tabs,
  Button,
  Space,
  message,
  Result,
  Spin,
  Radio,
  DatePicker,
  Tooltip,
} from 'antd';
import {
  CalendarOutlined,
  BarsOutlined,
  DashboardOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import GanttChart from './components/GanttChart/GanttChart';
import TaskList from './components/TaskList/TaskList';
import Dashboard from './components/Dashboard/Dashboard';
import FilterPanel from './components/FilterPanel/FilterPanel';
import {
  fetchTasks,
  updateTask as apiUpdateTask,
  createTask as apiCreateTask,
  deleteTask as apiDeleteTask,
  fetchCategories,
  fetchStages,
  fetchStatuses,
  fetchProcessTypes,
} from './services/api';
import { Task, Category, Stage, Status, ProcessType, GanttTask, GanttLink } from './types';
import moment from 'moment';
import './App.css';

const { Header, Content, Sider } = Layout;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [ganttViewMode, setGanttViewMode] = useState<
    'day' | 'week' | 'month' | 'quarter' | 'year'
  >('month');
  const [siderCollapsed, setSiderCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('1');
  const [filters, setFilters] = useState<any>({});

  const applyFilters = useCallback((newFilters: any, sourceTasks: Task[]) => {
    setFilters(newFilters);
    let filtered = [...sourceTasks];

    if (newFilters.category_id) {
      filtered = filtered.filter(task => task.category_id === newFilters.category_id);
    }
    if (newFilters.process_type_id) {
      filtered = filtered.filter(task => task.process_type_id === newFilters.process_type_id);
    }
    if (newFilters.stage_id) {
      filtered = filtered.filter(task => task.stage_id === newFilters.stage_id);
    }
    if (newFilters.status_id) {
      filtered = filtered.filter(task => task.status_id === newFilters.status_id);
    }
    if (newFilters.date_range && newFilters.date_range[0] && newFilters.date_range[1]) {
      const startDate = newFilters.date_range[0].startOf('day');
      const endDate = newFilters.date_range[1].endOf('day');

      filtered = filtered.filter(task => {
        if (!task.start_date || !task.end_date) return false;
        const taskStart = moment(task.start_date);
        const taskEnd = moment(task.end_date);
        return taskStart.isSameOrBefore(endDate) && taskEnd.isSameOrAfter(startDate);
      });
    }

    setFilteredTasks(filtered);
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, categoriesData, stagesData, statusesData, processTypesData] = await Promise.all([
        fetchTasks(),
        fetchCategories(),
        fetchStages(),
        fetchStatuses(),
        fetchProcessTypes(),
      ]);

      setTasks(tasksData);
      applyFilters(filters, tasksData);
      setCategories(categoriesData);
      setStages(stagesData);
      setStatuses(statusesData);
      setProcessTypes(processTypesData);
    } catch (err) {
      console.error('데이터 로딩 중 오류 발생:', err);
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(`데이터 로딩 실패: ${errorMsg}. 잠시 후 다시 시도해주세요.`);
      message.error('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [applyFilters, filters]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleAddTask = useCallback(async (newTaskData: Omit<Task, 'id'>) => {
    try {
      const createdTask = await apiCreateTask(newTaskData);
      const updatedTasks = [...tasks, createdTask];
      setTasks(updatedTasks);
      applyFilters(filters, updatedTasks);
      message.success(`'${createdTask.name}' 작업이 추가되었습니다`);
    } catch (error) {
      console.error('작업 추가 중 오류 발생:', error);
      message.error('작업 추가 중 오류가 발생했습니다');
    }
  }, [tasks, filters, applyFilters]);

  const handleTaskUpdate = useCallback(async (id: number | string, updatedData: Partial<Task>) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) {
      console.error("Invalid task ID received:", id);
      message.error('잘못된 작업 ID입니다.');
      return;
    }

    const originalTasks = [...tasks];
    const originalTask = originalTasks.find(task => task.id === numericId);
    if (!originalTask) return;

    const updatedTasksOptimistic = tasks.map(task =>
      task.id === numericId ? { ...task, ...updatedData } : task
    );
    setTasks(updatedTasksOptimistic);
    applyFilters(filters, updatedTasksOptimistic);

    try {
      const updatedTaskFromServer = await apiUpdateTask(numericId, updatedData);
      const finalTasks = originalTasks.map(task =>
        task.id === numericId ? updatedTaskFromServer : task
      );
      setTasks(finalTasks);
      applyFilters(filters, finalTasks);
    } catch (error) {
      console.error('작업 업데이트 중 오류 발생:', error);
      message.error('작업 업데이트 실패. 변경 사항을 되돌립니다.');
      setTasks(originalTasks);
      applyFilters(filters, originalTasks);
    }
  }, [tasks, filters, applyFilters]);

  const handleDeleteTask = useCallback(async (id: number) => {
    const originalTasks = [...tasks];
    const taskToDelete = originalTasks.find(task => task.id === id);
    if (!taskToDelete) return;

    const updatedTasksOptimistic = originalTasks.filter(task => task.id !== id);
    setTasks(updatedTasksOptimistic);
    applyFilters(filters, updatedTasksOptimistic);

    try {
      await apiDeleteTask(id);
      message.success(`'${taskToDelete.name}' 작업이 삭제되었습니다`);
    } catch (error) {
      console.error('작업 삭제 중 오류 발생:', error);
      message.error('작업 삭제 실패. 변경 사항을 되돌립니다.');
      setTasks(originalTasks);
      applyFilters(filters, originalTasks);
    }
  }, [tasks, filters, applyFilters]);

  const handleFilterChange = useCallback((newFilters: any) => {
    applyFilters(newFilters, tasks);
  }, [tasks, applyFilters]);

  const ganttData: { data: GanttTask[]; links: GanttLink[] } = {
    data: filteredTasks.map(task => ({
      ...task,
      id: task.id,
      text: task.name,
      start_date: task.start_date,
      end_date: task.end_date,
      progress: task.progress / 100,
      parent: 0,
    })),
    links: [],
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="데이터 로딩중..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <Result
          status="error"
          title="오류 발생"
          subTitle={error}
          extra={<Button type="primary" onClick={() => window.location.reload()}>새로고침</Button>}
        />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="logo">일정 관리 시스템</div>
      </Header>
      <Layout>
        <Sider
          className="app-sider"
          width={250}
          collapsible
          collapsed={siderCollapsed}
          onCollapse={setSiderCollapsed}
          theme="light"
        >
          {!siderCollapsed && (
             <div style={{ padding: '16px' }}>
                 <FilterPanel
                    categories={categories}
                    stages={stages}
                    statuses={statuses}
                    processTypes={processTypes}
                    onFilter={handleFilterChange}
                    initialFilters={filters}
                 />
             </div>
          )}
           {siderCollapsed && (
             <div style={{ padding: '16px', textAlign: 'center' }}>
               <Tooltip title="필터 보기">
                 <Button icon={<FilterOutlined />} onClick={() => setSiderCollapsed(false)} />
               </Tooltip>
            </div>
           )}
        </Sider>
        <Layout style={{ marginLeft: siderCollapsed ? 0 : '16px', transition: 'margin-left 0.2s' }}>
          <Content style={{ padding: '0 24px', minHeight: 280, background: '#fff' }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
              <TabPane
                tab={
                  <span>
                    <DashboardOutlined style={{ marginRight: '8px' }} />
                    대시보드
                  </span>
                }
                key="1"
              >
                <Dashboard tasks={filteredTasks} statuses={statuses} />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <CalendarOutlined style={{ marginRight: '8px' }} />
                    간트 차트
                  </span>
                }
                key="2"
              >
                <div className="tab-content-wrapper">
                  <Space style={{ marginBottom: 16 }}>
                    <Radio.Group
                      value={ganttViewMode}
                      onChange={e => setGanttViewMode(e.target.value)}
                    >
                      <Radio.Button value="day">Day</Radio.Button>
                      <Radio.Button value="week">Week</Radio.Button>
                      <Radio.Button value="month">Month</Radio.Button>
                      <Radio.Button value="quarter">Quarter</Radio.Button>
                      <Radio.Button value="year">Year</Radio.Button>
                    </Radio.Group>
                  </Space>
                  <GanttChart
                    tasks={ganttData}
                    onTaskUpdate={handleTaskUpdate}
                    viewMode={ganttViewMode}
                    categories={categories}
                    stages={stages}
                    statuses={statuses}
                  />
                </div>
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <BarsOutlined style={{ marginRight: '8px' }} />
                    작업 목록
                  </span>
                }
                key="3"
              >
                <TaskList 
                  tasks={filteredTasks} 
                  categories={categories}
                  processTypes={processTypes}
                  stages={stages}
                  statuses={statuses}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleTaskUpdate}
                  onDeleteTask={handleDeleteTask}
                  onRefreshTasks={loadInitialData}
                />
              </TabPane>
            </Tabs>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
