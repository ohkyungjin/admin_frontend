import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Card, Space, message, Dropdown, Select, TimePicker, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { memorialRoomService } from '../../services/memorialRoomService';
import dayjs from 'dayjs';

const { TextArea } = Input;

export const MemorialRoomManagementPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  // 추모실 목록 조회 - 필터 파라미터 제거
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await memorialRoomService.getRooms();
      setRooms(response.results || []);
    } catch (error) {
      console.error('추모실 목록 조회 오류:', error);
      message.error('추모실 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 필터링된 데이터
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = searchText
        ? (room.name?.toLowerCase().includes(searchText.toLowerCase()) ||
           room.notes?.toLowerCase().includes(searchText.toLowerCase()))
        : true;
      
      const matchesActive = activeFilter !== null
        ? room.is_active === activeFilter
        : true;

      return matchesSearch && matchesActive;
    });
  }, [rooms, searchText, activeFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 운영시간 포맷 함수
  const formatOperatingHours = (start, end) => {
    if (!start || !end) return null;
    return {
      start_time: start.format('HH:mm'),
      end_time: end.format('HH:mm')
    };
  };

  // 운영시간 파싱 함수
  const parseOperatingHours = (operatingHours) => {
    if (!operatingHours) return { start: null, end: null };
    const [start, end] = operatingHours.split('-');
    return {
      start: start ? dayjs(start, 'HH:mm') : null,
      end: end ? dayjs(end, 'HH:mm') : null
    };
  };

  // 추모실 생성/수정 처리
  const handleSubmit = async (values) => {
    const formattedValues = {
      name: values.name,
      capacity: values.capacity || 10,
      description: values.notes,
      is_active: values.is_active ?? true,
      operating_hours: values.operating_hours?.start && values.operating_hours?.end
        ? formatOperatingHours(values.operating_hours.start, values.operating_hours.end)
        : null
    };

    Modal.confirm({
      title: editingRoom ? '추모실 수정' : '추모실 등록',
      content: editingRoom 
        ? `${values.name} 추모실의 정보를 수정하시겠습니까?`
        : `${values.name} 추모실을 등록하시겠습니까?`,
      okText: editingRoom ? '수정' : '등록',
      cancelText: '취소',
      okButtonProps: { 
        className: "!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
      },
      cancelButtonProps: { 
        className: "!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
      },
      onOk: async () => {
        try {
          if (editingRoom) {
            await memorialRoomService.updateRoom(editingRoom.id, formattedValues);
            message.success('추모실이 수정되었습니다.');
          } else {
            await memorialRoomService.createRoom(formattedValues);
            message.success('새 추모실이 등록되었습니다.');
          }
          setModalVisible(false);
          setEditingRoom(null);
          form.resetFields();
          fetchRooms();
        } catch (error) {
          console.error('추모실 저장 오류:', error);
          if (error.response?.data?.code === 'M002') {
            message.error('이미 존재하는 추모실 이름입니다.');
          } else if (error.response?.data?.code === 'M004') {
            message.error('사용중인 추모실은 삭제할 수 없습니다.');
          } else {
            message.error('추모실 저장에 실패했습니다.');
          }
        }
      }
    });
  };

  // 수정 모달 열 때 기존 데이터 설정
  useEffect(() => {
    if (editingRoom) {
      const { start, end } = parseOperatingHours(editingRoom.operating_hours);
      form.setFieldsValue({
        ...editingRoom,
        operating_hours: {
          start,
          end
        }
      });
    }
  }, [editingRoom, form]);

  // 추모실 삭제 처리
  const handleDelete = async (id) => {
    try {
      await memorialRoomService.deleteRoom(id);
      message.success('추모실이 삭제되었습니다.');
      fetchRooms();
    } catch (error) {
      console.error('추모실 삭제 오류:', error);
      if (error.response?.data?.code === 'M004') {
        message.error('사용중인 추모실은 삭제할 수 없습니다.');
      } else {
        message.error('추모실 삭제에 실패했습니다.');
      }
    }
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '추모실명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '수용 인원',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => capacity || '-',
    },
    {
      title: '상태',
      dataIndex: 'current_status',
      key: 'current_status',
      render: (status) => {
        const statusMap = {
          available: { text: '사용가능', color: 'green' },
          in_use: { text: '사용중', color: 'blue' },
          reserved: { text: '예약중', color: 'orange' }
        };
        const { text, color } = statusMap[status] || { text: '-', color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '운영 시간',
      dataIndex: 'operating_hours',
      key: 'operating_hours',
      render: (hours) => hours || '-'
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description) => description || '-',
    },
    {
      title: '관리',
      key: 'action',
      width: 80,
      render: (_, record) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '수정',
            onClick: () => {
              setEditingRoom(record);
              form.setFieldsValue(record);
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
                title: '추모실 삭제',
                content: '정말로 이 추모실을 삭제하시겠습니까?',
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
          </Space>
        );
      }
    }
  ];

  return (
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">추모실 관리</h1>
          <Button
            type="primary"
            onClick={() => {
              setEditingRoom(null);
              form.resetFields();
              setModalVisible(true);
            }}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            새 추모실 추가
          </Button>
        </div>

        {/* 필터 섹션 */}
        <div className="mb-6 flex gap-4">
          <Input.Search
            placeholder="추모실명 또는 특이사항 검색"
            onChange={e => setSearchText(e.target.value)}
            onSearch={value => setSearchText(value)}
            className="max-w-xs"
            allowClear
          />
          <Select
            placeholder="사용 가능 여부"
            allowClear
            onChange={value => setActiveFilter(value)}
            className="w-40"
          >
            <Select.Option value={true}>사용 가능</Select.Option>
            <Select.Option value={false}>사용 불가</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRooms}
          rowKey="id"
          loading={loading}
          className="w-full"
          components={{
            header: {
              cell: props => (
                <th 
                  {...props} 
                  className="bg-gray-100 text-blue-800 font-medium"
                />
              )
            }
          }}
          locale={{
            emptyText: '추모실이 없습니다.'
          }}
        />

        <Modal
          title={
            <h2 className="text-2xl font-bold text-blue-800">
              {editingRoom ? '추모실 수정' : '새 추모실 추가'}
            </h2>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingRoom(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
          maskClosable={false}
        >
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            className="mt-4"
          >
            <Form.Item
              name="name"
              label="추모실명"
              rules={[{ required: true, message: '추모실명을 입력해주세요' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="capacity"
              label="수용 인원"
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>

            <Form.Item
              name="operating_hours"
              label="운영 시간"
              rules={[
                { 
                  required: true,
                  message: '운영 시간을 입력해주세요',
                  validator: (_, value) => {
                    if (!value?.start || !value?.end) {
                      return Promise.reject('시작 시간과 종료 시간을 모두 입력해주세요');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Space.Compact className="w-full">
                <Form.Item
                  name={['operating_hours', 'start']}
                  noStyle
                >
                  <TimePicker
                    format="HH:mm"
                    placeholder="시작 시간"
                    className="w-full"
                    minuteStep={30}
                    hideDisabledOptions
                    showNow={false}
                    popupClassName="memorial-room-time-picker"
                  />
                </Form.Item>
                <Form.Item
                  name={['operating_hours', 'end']}
                  noStyle
                >
                  <TimePicker
                    format="HH:mm"
                    placeholder="종료 시간"
                    className="w-full"
                    minuteStep={30}
                    hideDisabledOptions
                    showNow={false}
                    popupClassName="memorial-room-time-picker"
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            <Form.Item
              name="notes"
              label="특이사항"
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="사용 가능"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch className="!bg-gray-300 [&.ant-switch-checked]:!bg-blue-800 hover:[&.ant-switch-checked]:!bg-blue-900" />
            </Form.Item>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingRoom(null);
                  form.resetFields();
                }}
                className="!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
              >
                취소
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
              >
                {editingRoom ? '수정' : '추가'}
              </Button>
            </div>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}; 