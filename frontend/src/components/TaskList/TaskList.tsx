import React, { useState, useCallback } from 'react';
import { Table, Tag, Space, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Tooltip, Row, Col, Upload, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { Task, Category, Stage, Status, ProcessType } from '../../types'; // Import ProcessType
import { bulkCreateTasks } from '../../services/api'; // bulkCreateTasks API 함수 import

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  processTypes: ProcessType[]; // Add processTypes prop
  stages: Stage[];
  statuses: Status[];
  onAddTask: (taskData: Omit<Task, 'id'>) => void;
  onUpdateTask: (id: number, taskData: Partial<Task>) => void;
  onDeleteTask: (id: number) => void;
  onRefreshTasks: () => void; // 새로고침 함수 타입 정의
}

const { Option } = Select;
const { RangePicker } = DatePicker;

const TaskList: React.FC<TaskListProps> = ({ 
  tasks,
  categories,
  processTypes, // Destructure processTypes
  stages,
  statuses,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onRefreshTasks
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isUploading, setIsUploading] = useState(false); // 업로드 상태 추가

  const showModal = (task?: Task) => {
    setEditingTask(task || null);
    if (task) {
      // Ensure all dates are Moment objects for DatePicker
      form.setFieldsValue({
        ...task,
        start_date: task.start_date ? moment(task.start_date) : null,
        end_date: task.end_date ? moment(task.end_date) : null,
        po_date: task.po_date ? moment(task.po_date) : null,
        expected_delivery_date: task.expected_delivery_date ? moment(task.expected_delivery_date) : null,
        actual_delivery_date: task.actual_delivery_date ? moment(task.actual_delivery_date) : null,
        installation_start_date: task.installation_start_date ? moment(task.installation_start_date) : null,
        installation_end_date: task.installation_end_date ? moment(task.installation_end_date) : null,
        actual_start_date: task.actual_start_date ? moment(task.actual_start_date) : null,
        actual_end_date: task.actual_end_date ? moment(task.actual_end_date) : null,
      });
    } else {
      form.resetFields();
      // Set default status to '미진행' (ID 1) when adding new task
      form.setFieldsValue({ status_id: 1, progress: 0 }); 
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTask(null);
    form.resetFields();
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const formattedValues = {
        ...values,
        // Format all dates back to string for API
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        po_date: values.po_date ? values.po_date.format('YYYY-MM-DD') : null,
        expected_delivery_date: values.expected_delivery_date ? values.expected_delivery_date.format('YYYY-MM-DD') : null,
        actual_delivery_date: values.actual_delivery_date ? values.actual_delivery_date.format('YYYY-MM-DD') : null,
        installation_start_date: values.installation_start_date ? values.installation_start_date.format('YYYY-MM-DD') : null,
        installation_end_date: values.installation_end_date ? values.installation_end_date.format('YYYY-MM-DD') : null,
        actual_start_date: values.actual_start_date ? values.actual_start_date.format('YYYY-MM-DD') : null,
        actual_end_date: values.actual_end_date ? values.actual_end_date.format('YYYY-MM-DD') : null,
        progress: values.progress || 0, // Ensure progress is a number
      };

      if (editingTask) {
        onUpdateTask(editingTask.id, formattedValues);
      } else {
        // Remove id field if it exists in values (shouldn't for new task)
        const { id, ...newTaskData } = formattedValues;
        onAddTask(newTaskData as Omit<Task, 'id'>); 
      }

      handleCancel(); // Close modal and reset form after submit
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  // CSV 업로드 처리 함수
  const handleUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      message.error('CSV 파일만 업로드할 수 있습니다.');
      return false; // Upload 컴포넌트의 업로드 중단
    }

    setIsUploading(true);
    try {
      const response = await bulkCreateTasks(file);
      message.success(`${response.message} (성공: ${response.successCount}, 실패: ${response.errorCount})`);
      if (response.errors && response.errors.length > 0) {
        // 실패 내역이 있으면 Modal로 보여주기
        Modal.warning({
          title: '일부 항목 업로드 실패',
          content: (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {response.errors.map((err: string, index: number) => (
                <p key={index}>{err}</p>
              ))}
            </div>
          ),
          width: 600,
        });
      }
      onRefreshTasks(); // 업로드 성공 후 목록 새로고침
    } catch (error: any) {
      console.error('CSV 업로드 오류:', error);
      message.error(error.response?.data?.message || 'CSV 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
    
    // Upload 컴포넌트가 내부적으로 파일을 다시 업로드하지 않도록 false 반환
    return false; 
  }, [onRefreshTasks]);

  const columns = [
    {
      title: '설비명',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      // Display Process Type name along with Task name
      render: (text: string, record: Task) => {
        const processType = processTypes.find(pt => pt.id === record.process_type_id);
        return (
          <Tooltip title={text}> {/* Add tooltip for long names */}
            <span>{processType ? `[${processType.name}] ` : ''}{text}</span>
          </Tooltip>
        );
      }
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category',
      width: 150,
      filters: categories.map(cat => ({ text: cat.name, value: cat.id })),
      onFilter: (value: any, record: Task) => record.category_id === value,
      render: (text: string, record: Task) => record.category_name || 'N/A' // Use joined name
    },
    {
      title: '단계',
      dataIndex: 'stage_name',
      key: 'stage',
      width: 100,
      filters: stages.map(st => ({ text: st.name, value: st.id })),
      onFilter: (value: any, record: Task) => record.stage_id === value,
      render: (text: string, record: Task) => record.stage_name || 'N/A' // Use joined name
    },
    {
      title: '상태',
      dataIndex: 'status_name',
      key: 'status',
      width: 100,
      filters: statuses.map(st => ({ text: st.name, value: st.id })),
      onFilter: (value: any, record: Task) => record.status_id === value,
      render: (text: string, record: Task) => (
        <Tag color={record.status_color || 'default'}>{record.status_name || 'N/A'}</Tag> // Use joined name and color
      )
    },
    {
      title: '시작일',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      sorter: (a: Task, b: Task) => moment(a.start_date).unix() - moment(b.start_date).unix(),
      render: (date: string) => date ? moment(date).format('YYYY-MM-DD') : 'N/A'
    },
    {
      title: '종료일',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      sorter: (a: Task, b: Task) => moment(a.end_date).unix() - moment(b.end_date).unix(),
      render: (date: string) => date ? moment(date).format('YYYY-MM-DD') : 'N/A'
    },
    {
      title: '진행률',
      dataIndex: 'progress',
      key: 'progress',
      width: 100,
      sorter: (a: Task, b: Task) => a.progress - b.progress,
      render: (progress: number) => `${progress || 0}%`
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      fixed: 'right' as 'right', // Fix action column to the right
      render: (_: any, record: Task) => (
        <Space size="small"> {/* Use small space */}
          <Tooltip title="수정">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="삭제">
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger 
              onClick={() => {
                Modal.confirm({
                  title: '작업 삭제 확인',
                  content: `'${record.name}' 작업을 정말 삭제하시겠습니까?`, // Show task name
                  okText: '삭제',
                  okType: 'danger',
                  cancelText: '취소',
                  onOk: () => onDeleteTask(record.id)
                });
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}> {/* 버튼들을 오른쪽 정렬하고 간격 추가 */}
        {/* CSV 업로드 버튼 추가 */}
        <Upload
          accept=".csv" // 파일 선택 시 CSV만 보이도록
          showUploadList={false} // 업로드 목록 숨김
          beforeUpload={handleUpload} // 파일 선택 시 handleUpload 호출
          disabled={isUploading} // 업로드 중 비활성화
        >
          <Button 
            icon={<UploadOutlined />} 
            loading={isUploading}
          >
            CSV 업로드
          </Button>
        </Upload>
        
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          새 작업 추가
        </Button>
      </div>
      <Table 
        columns={columns}
        // Use joined names from the Task object directly
        dataSource={tasks.map(task => ({ ...task, key: task.id }))} 
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }} // Add pagination options
        scroll={{ x: 1200 }} // Enable horizontal scroll if content overflows
        rowKey="id" // Ensure unique key
      />

      <Modal
        title={editingTask ? "작업 수정" : "새 작업 추가"}
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText={editingTask ? "저장" : "추가"}
        cancelText="취소"
        destroyOnClose // Reset form state when modal is closed
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="task_form"
        >
          {/* Hidden field for ID during edit */}
          {editingTask && <Form.Item name="id" hidden><Input /></Form.Item>}
          
          <Form.Item
            name="name"
            label="설비명"
            rules={[{ required: true, message: '설비명을 입력하세요.' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}> {/* Use Row and Col for better layout */}
            <Col span={12}>
              <Form.Item
                name="category_id"
                label="Category"
                rules={[{ required: true, message: 'Category를 선택하세요.' }]}
              >
                <Select placeholder="Category 선택">
                  {categories.map(category => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="process_type_id"
                label="Process Type"
                rules={[{ required: true, message: 'Process Type을 선택하세요.' }]}
              >
                 <Select placeholder="Process Type 선택">
                  {processTypes.map(pt => (
                    <Option key={pt.id} value={pt.id}>
                      {pt.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
             <Col span={12}>
              <Form.Item
                name="stage_id"
                label="단계"
                rules={[{ required: true, message: '단계를 선택하세요.' }]}
              >
                <Select placeholder="단계 선택">
                  {stages.map(stage => (
                    <Option key={stage.id} value={stage.id}>
                      {stage.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status_id"
                label="상태"
                rules={[{ required: true, message: '상태를 선택하세요.' }]}
              >
                <Select placeholder="상태 선택">
                  {statuses.map(status => (
                    <Option key={status.id} value={status.id}>
                      {status.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="시작일"
                rules={[{ required: true, message: '시작일을 선택하세요.' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label="종료일"
                rules={[{ required: true, message: '종료일을 선택하세요.' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="spec"
            label="상세 사양 (Spec)"
          >
            <Input.TextArea rows={2} placeholder="설비의 상세 사양 입력" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vendor"
                label="공급 업체 (Vendor)"
              >
                <Input placeholder="공급 업체명 입력" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="po_number"
                label="PO 번호"
              >
                <Input placeholder="발주 번호 입력" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="po_date"
                label="PO 날짜"
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="날짜 선택" />
              </Form.Item>
            </Col>
             <Col span={12}>
              <Form.Item
                name="expected_delivery_date"
                label="납품 예정일"
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="날짜 선택" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="installation_start_date"
                label="설치 시작 예정일"
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="날짜 선택" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="installation_end_date"
                label="설치 종료 예정일"
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="날짜 선택" />
              </Form.Item>
            </Col>
          </Row>

           <Row gutter={16}>
             <Col span={12}>
               <Form.Item
                 name="actual_start_date"
                 label="실제 시작일"
               >
                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="날짜 선택" />
               </Form.Item>
             </Col>
             <Col span={12}>
               <Form.Item
                 name="actual_end_date"
                 label="실제 종료일"
               >
                 <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="날짜 선택" />
               </Form.Item>
             </Col>
           </Row>

           <Row gutter={16}>
              <Col span={12}>
                 <Form.Item
                   name="actual_delivery_date"
                   label="실제 납품일"
                 >
                   <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="날짜 선택" />
                 </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="progress"
                  label="진행률 (%)"
                  rules={[{ type: 'number', min: 0, max: 100, message: '0과 100 사이의 숫자를 입력하세요.' }]}
                >
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

          <Form.Item
            name="notes"
            label="비고"
          >
            <Input.TextArea rows={3} placeholder="추가 메모 사항 입력" />
          </Form.Item>

        </Form>
      </Modal>
    </>
  );
};

export default TaskList;
