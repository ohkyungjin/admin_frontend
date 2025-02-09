import React, { useState, useEffect } from 'react';
import { accountService } from '../../services/accountService';
import { Card, Button, Table, Space, Modal, Dropdown, message } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';

// 상수 분리
const AUTH_LEVELS = {
  INSTRUCTOR: 1,    // 지도사
  ADMIN: 2,        // 관리자
  SUPER_ADMIN: 3   // 슈퍼관리자
};

const INITIAL_FORM_STATE = {
  email: '',
  password: '',
  password_confirm: '',
  name: '',
  phone: '',
  department: '',
  position: '',
  auth_level: AUTH_LEVELS.INSTRUCTOR
};

export const AccountManagementPage = () => {
  // 상태 관리
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 폼 초기화
  const resetForm = () => setFormData(INITIAL_FORM_STATE);

  // 계정 목록 조회
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountService.getUsers();
      const accountsData = response?.data?.results || response?.data || [];
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      console.error('계정 목록 조회 오류:', err);
      setError('계정 목록을 불러오는데 실패했습니다.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^0-9]/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  // 입력 필드 변경 처리
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' 
        ? formatPhoneNumber(value)
        : name === 'auth_level' 
          ? parseInt(value) 
          : value
    }));
  };

  // 계정 삭제
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await accountService.deleteUser(id);
      await fetchAccounts();
      message.success('계정이 성공적으로 삭제되었습니다.');
    } catch (err) {
      setError('계정 삭제 중 오류가 발생했습니다.');
      message.error('계정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달 열기
  const openModal = (account = null) => {
    setSelectedAccount(account);
    if (account) {
      setFormData({
        ...INITIAL_FORM_STATE,
        email: account.email,
        name: account.name,
        phone: account.phone || '',
        department: account.department || '',
        position: account.position || '',
        auth_level: account.auth_level || AUTH_LEVELS.INSTRUCTOR
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
    setError('');
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
    resetForm();
    setError('');
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    // 필수 필드 검증
    const requiredFields = ['email', 'name', 'phone'];
    if (!selectedAccount) {
      requiredFields.push('password', 'password_confirm');
    }
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 비밀번호 일치 검증
    if (!selectedAccount && formData.password !== formData.password_confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      const accountData = {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        auth_level: formData.auth_level
      };

      let response;
      
      if (!selectedAccount) {
        accountData.password = formData.password;
        accountData.password_confirm = formData.password_confirm;
        response = await accountService.createUser(accountData);
        
        if (!response.success) {
          throw new Error(response.error);
        }
        message.success('새 계정이 성공적으로 생성되었습니다.');
      } else {
        response = await accountService.updateUser(selectedAccount.id, accountData);
        message.success('계정 정보가 성공적으로 수정되었습니다.');
      }
      
      await fetchAccounts();
      closeModal();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || '계정 처리 중 오류가 발생했습니다.');
      message.error(err.message || '계정 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 테이블 컬럼 설정
  const columns = [
    { title: '이메일', dataIndex: 'email', key: 'email' },
    { title: '이름', dataIndex: 'name', key: 'name' },
    { title: '부서', dataIndex: 'department', key: 'department' },
    { title: '직책', dataIndex: 'position', key: 'position' },
    { 
      title: '권한', 
      dataIndex: 'auth_level', 
      key: 'auth_level',
      render: (text) => `Level ${text}`
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
            onClick: () => openModal(record)
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '삭제',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '계정 삭제',
                content: '정말로 이 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
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
            <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
              <Button type="text" icon={<MoreOutlined />} className="text-gray-600 hover:text-gray-800" />
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
          <h1 className="text-2xl font-bold text-blue-800">계정 관리</h1>
          <Button
            type="primary"
            onClick={() => openModal()}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            새 계정 추가
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          className="w-full"
          loading={loading}
          components={{
            header: {
              cell: props => (
                <th {...props} className="bg-gray-100 text-blue-800 font-medium" />
              )
            }
          }}
          locale={{
            emptyText: '계정이 없습니다.'
          }}
        />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="relative bg-white rounded-lg w-full max-w-xl mx-auto my-8 shadow-xl">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedAccount ? '계정 수정' : '계정 추가'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        disabled={selectedAccount}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {!selectedAccount && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                        <input
                          type="password"
                          name="password_confirm"
                          value={formData.password_confirm}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        maxLength={13}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">권한 레벨</label>
                      <select
                        name="auth_level"
                        value={formData.auth_level}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={AUTH_LEVELS.INSTRUCTOR}>지도사</option>
                        <option value={AUTH_LEVELS.ADMIN}>관리자</option>
                        <option value={AUTH_LEVELS.SUPER_ADMIN}>슈퍼관리자</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047857] transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? '처리중...' : selectedAccount ? '수정' : '추가'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}; 