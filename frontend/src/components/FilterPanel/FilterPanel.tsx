import React from 'react';
import { Card, Form, Select, DatePicker, Button, Space, Tooltip } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { Category, Stage, Status, ProcessType } from '../../types';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterPanelProps {
  categories: Category[];
  stages: Stage[];
  statuses: Status[];
  processTypes: ProcessType[]; // Add processTypes
  onFilter: (filters: any) => void;
  initialFilters?: any; // Optional initial filter values
}

// Define filter structure type (optional but recommended)
interface Filters {
  category_id?: number;
  stage_id?: number;
  status_id?: number;
  process_type_id?: number;
  date_range?: [moment.Moment | null, moment.Moment | null] | null;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  categories, 
  stages, 
  statuses, 
  processTypes, 
  onFilter, 
  initialFilters = {} 
}) => {
  const [form] = Form.useForm();

  const handleFilter = () => {
    const values = form.getFieldsValue();
    const filters: Filters = {
      category_id: values.category_id,
      stage_id: values.stage_id,
      status_id: values.status_id,
      process_type_id: values.process_type_id,
      date_range: values.date_range
    };
    // Remove undefined/null filters before passing
    Object.keys(filters).forEach(key => filters[key as keyof Filters] === undefined || filters[key as keyof Filters] === null ? delete filters[key as keyof Filters] : {});
    onFilter(filters);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({}); // Pass empty object to clear filters in parent
  };

  // Set initial form values if provided
  React.useEffect(() => {
    form.setFieldsValue(initialFilters);
  }, [initialFilters, form]);

  return (
    <Card title="필터" size="small" extra={<FilterOutlined />}> {/* Use small size card */}
      <Form form={form} layout="vertical" onFinish={handleFilter}> {/* Trigger filter on Enter key in fields */}
        <Form.Item name="category_id" label="Category" style={{ marginBottom: 8 }}>
          <Select placeholder="모든 Category" allowClear>
            {categories.map(category => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="process_type_id" label="Process Type" style={{ marginBottom: 8 }}>
          <Select placeholder="모든 Process Type" allowClear>
            {processTypes.map(pt => (
              <Option key={pt.id} value={pt.id}>
                {pt.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="stage_id" label="단계" style={{ marginBottom: 8 }}>
          <Select placeholder="모든 단계" allowClear>
            {stages.map(stage => (
              <Option key={stage.id} value={stage.id}>
                {stage.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="status_id" label="상태" style={{ marginBottom: 8 }}>
          <Select placeholder="모든 상태" allowClear>
            {statuses.map(status => (
              <Option key={status.id} value={status.id}>
                {status.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="date_range" label="기간" style={{ marginBottom: 16 }}>
          <RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Space style={{ display: 'flex', justifyContent: 'space-between' }} >
          <Tooltip title="필터 적용">
            <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter} htmlType="submit">
              적용
            </Button>
          </Tooltip>
          <Tooltip title="필터 초기화">
            <Button icon={<ClearOutlined />} onClick={handleReset}>
              초기화
            </Button>
          </Tooltip>
        </Space>
      </Form>
    </Card>
  );
};

export default FilterPanel;
