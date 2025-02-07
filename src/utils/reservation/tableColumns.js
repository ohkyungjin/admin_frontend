import { Space, Tag, Select, Button, Dropdown, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { formatToLocal } from '../dateUtils';
import { STATUS_COLORS, STATUS_CHOICES } from '../../constants/reservation';

export const getTableColumns = ({
  handleDelete,
  handleStatusChange,
  packages,
  memorialRooms,
  staff,
  setSelectedReservation,
  setModalVisible
}) => [
  {
    title: '예약일시',
    dataIndex: 'scheduled_at',
    key: 'scheduled_at',
    width: 180,
    render: formatToLocal,
    sorter: (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)
  },
  {
    title: '고객명',
    dataIndex: ['customer', 'name'],
    key: 'customer_name',
    width: 120,
    sorter: (a, b) => a.customer.name.localeCompare(b.customer.name)
  },
  {
    title: '반려동물명',
    dataIndex: ['pet', 'name'],
    key: 'pet_name',
    width: 120,
  },
  {
    title: '추모실',
    dataIndex: 'memorial_room_name',
    key: 'memorial_room',
    width: 150,
  },
  {
    title: '담당자',
    dataIndex: 'assigned_staff_name',
    key: 'assigned_staff',
    width: 120,
  },
  {
    title: '상태',
    dataIndex: 'status',
    key: 'status',
    width: 200,
    render: (status, record) => {
      const items = [
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: '수정',
          onClick: () => {
            console.log('수정 버튼 클릭 - 원본 데이터:', record);
            const reservationWithIds = {
              ...record,
              package_id: record.package_id,
              memorial_room_id: record.memorial_room_id,
              assigned_staff_id: record.assigned_staff_id
            };
            console.log('수정 모달에 전달되는 데이터:', reservationWithIds);
            setSelectedReservation(reservationWithIds);
            setModalVisible(true);
          }
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '삭제',
          danger: true,
          onClick: () => {
            Modal.confirm({
              title: '예약 삭제',
              content: '정말로 이 예약을 삭제하시겠습니까?',
              okText: '삭제',
              cancelText: '취소',
              okButtonProps: { 
                className: "!bg-red-500 !border-red-500 hover:!bg-red-600 hover:!border-red-600 !text-white"
              },
              cancelButtonProps: { 
                className: "!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
              },
              onOk: () => handleDelete(record.id)
            });
          }
        }
      ];

      return (
        <Space>
          <Tag color={STATUS_COLORS[status]}>
            {record.status_display}
          </Tag>
          {status !== 'completed' && (
            <>
              <Select
                size="small"
                value={status}
                onChange={(value) => handleStatusChange(record.id, value)}
                style={{ width: 100 }}
              >
                {STATUS_CHOICES.map(choice => (
                  <Select.Option key={choice.value} value={choice.value}>
                    {choice.label}
                  </Select.Option>
                ))}
              </Select>
              <Dropdown
                menu={{ items }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  className="text-gray-600 hover:text-gray-800"
                />
              </Dropdown>
            </>
          )}
        </Space>
      );
    },
    filters: STATUS_CHOICES.map(choice => ({
      text: choice.label,
      value: choice.value
    })),
    onFilter: (value, record) => record.status === value
  },
]; 