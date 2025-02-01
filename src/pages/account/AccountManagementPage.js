import React, { useState, useEffect } from 'react';
import { accountService } from '../../services/accountService';

export const AccountManagementPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const AUTH_LEVELS = {
    INSTRUCTOR: 1,    // 지도사
    ADMIN: 2,        // 관리자
    SUPER_ADMIN: 3   // 슈퍼관리자
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    name: '',
    phone: '',
    department: '',
    position: '',
    auth_level: AUTH_LEVELS.INSTRUCTOR  // 기본값을 지도사로 설정
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      password_confirm: '',
      name: '',
      phone: '',
      department: '',
      position: '',
      auth_level: AUTH_LEVELS.INSTRUCTOR
    });
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountService.getUsers();
      setAccounts(response);
    } catch (err) {
      setError('계정 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 11자리로 제한
    const limitedNumbers = numbers.slice(0, 11);
    
    // 구간별로 하이픈 추가
    let formattedNumber = '';
    if (limitedNumbers.length <= 3) {
      formattedNumber = limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      formattedNumber = `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else {
      formattedNumber = `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
    }
    
    return formattedNumber;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'auth_level' ? parseInt(value) : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 필수 필드 검증
      const requiredFields = ['email', 'name', 'phone'];
      if (!selectedAccount) {
        requiredFields.push('password', 'password_confirm');
      }
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        setError('모든 필수 항목을 입력해주세요.');
        setLoading(false);
        return;
      }

      // 비밀번호 일치 검증 (새 계정 생성 시에만)
      if (!selectedAccount && formData.password !== formData.password_confirm) {
        setError('비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }

      // 계정 데이터 준비
      const accountData = {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        auth_level: formData.auth_level
      };

      // 새 계정 생성 시에만 비밀번호 필드 추가
      if (!selectedAccount) {
        accountData.password = formData.password;
        accountData.password_confirm = formData.password_confirm; 
      }

      if (selectedAccount) {
        await accountService.updateUser(selectedAccount.id, accountData);
      } else {
        const createData = {
          ...accountData,
          password: formData.password,
          password_confirm: formData.password_confirm
        };
        await accountService.createUser(createData);
      }
      
      await fetchAccounts();
      setIsModalOpen(false);
      setSelectedAccount(null);
      resetForm();
    } catch (err) {
      console.error('Error:', err.response?.data);
      setError(err.response?.data?.message || '계정 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 계정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await accountService.deleteUser(id);
      await fetchAccounts();
    } catch (err) {
      setError('계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (account = null) => {
    if (account) {
      // 수정 모드
      setSelectedAccount(account);
      setFormData({
        email: account.email,
        password: '',
        password_confirm: '',
        name: account.name,
        phone: account.phone || '',
        department: account.department || '',
        position: account.position || '',
        auth_level: account.auth_level || AUTH_LEVELS.INSTRUCTOR
      });
    } else {
      // 추가 모드
      setSelectedAccount(null);
      resetForm();
    }
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
    resetForm();
    setError('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">계정 관리</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-colors"
        >
          계정 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부서</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">직책</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">권한</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap">{account.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{account.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{account.department}</td>
                <td className="px-6 py-4 whitespace-nowrap">{account.position}</td>
                <td className="px-6 py-4 whitespace-nowrap">Level {account.auth_level}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => openModal(account)}
                    className="text-[#059669] hover:text-[#047857] mr-3"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedAccount ? '계정 수정' : '계정 추가'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                  required
                  disabled={selectedAccount}
                />
              </div>

              {!selectedAccount && (
                <>
                  <div>
                    <label className="block text-sm mb-1">비밀번호</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">비밀번호 확인</label>
                    <input
                      type="password"
                      name="password_confirm"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm mb-1">이름</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">연락처</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                  required
                  maxLength={13}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">부서</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">직책</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">권한 레벨</label>
                <select
                  name="auth_level"
                  value={formData.auth_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                >
                  <option value={AUTH_LEVELS.INSTRUCTOR}>지도사</option>
                  <option value={AUTH_LEVELS.ADMIN}>관리자</option>
                  <option value={AUTH_LEVELS.SUPER_ADMIN}>슈퍼관리자</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047857] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? '처리중...' : selectedAccount ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 