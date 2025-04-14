import React from 'react';
import { Row, Col, Card, Statistic, Progress, Empty } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Task, Status } from '../../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Import recharts components
import moment from 'moment'; // Import moment for date comparison

interface DashboardProps {
  tasks: Task[];
  statuses: Status[]; // Pass statuses to get names and colors
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, statuses }) => {
  if (!tasks || tasks.length === 0) {
    return <Empty description="표시할 작업 데이터가 없습니다." />; // Show Empty state if no tasks
  }

  // Find status IDs based on names (more robust than hardcoding IDs)
  const statusMap = statuses.reduce((acc, curr) => {
    acc[curr.name] = curr.id;
    return acc;
  }, {} as { [key: string]: number });

  const completedStatusId = statusMap['완료'] || 3;
  const inProgressStatusId = statusMap['진행중'] || 2;
  const pendingStatusId = statusMap['미진행'] || 1;

  // --- Calculate Statistics --- //
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status_id === completedStatusId).length;
  const inProgressTasks = tasks.filter(task => task.status_id === inProgressStatusId).length;
  const pendingTasks = tasks.filter(task => task.status_id === pendingStatusId).length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate delayed tasks more accurately
  const todayStr = moment().format('YYYY-MM-DD');
  const delayedTasks = tasks.filter(task => 
    task.end_date && // Ensure end_date exists
    moment(task.end_date).isBefore(todayStr) && // Check if end_date is before today
    task.status_id !== completedStatusId // Check if not completed
  ).length;

  // --- Prepare Chart Data --- //
  const statusChartData = statuses.map(status => ({
    name: status.name,
    value: tasks.filter(task => task.status_id === status.id).length,
    fill: status.color || '#8884d8' // Use status color, default if missing
  })).filter(data => data.value > 0); // Only include statuses with tasks

  return (
    <div>
      {/* Statistics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}> {/* Use borderless cards */}
            <Statistic
              title="전체 작업"
              value={totalTasks}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="완료된 작업"
              value={completedTasks}
              valueStyle={{ color: '#52c41a' }} // Use status color
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="진행중인 작업"
              value={inProgressTasks}
              valueStyle={{ color: '#fa8c16' }} // Use status color
              prefix={<SyncOutlined spin />} // Use spinning sync icon
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="지연된 작업"
              value={delayedTasks}
              valueStyle={{ color: '#f5222d' }} // Red color for delay
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress and Chart Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="전체 진행률" bordered={false}>
            <Progress 
              percent={completionRate} 
              status={completionRate === 100 ? 'success' : (inProgressTasks > 0 ? 'active' : 'normal')} 
              strokeWidth={15}
              showInfo={true} // Ensure percentage text is shown
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="상태별 작업 분포" bordered={false}>
            <div style={{ height: 250 }}> {/* Increase chart height */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    // Custom label formatter
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      // Show label only if percentage is significant
                      return percent > 0.05 ? (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      ) : null;
                    }}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: number, name: string) => [`${value}개`, name]} // Custom tooltip content
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
