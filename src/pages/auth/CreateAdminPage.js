import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../../services/accountService';

export const CreateAdminPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    department: '관리부',
    position: '관리자',
    auth_level: 5
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await accountService.createUser(formData);
      alert('관리자 계정이 생성되었습니다.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || '관리자 계정 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">CIELO PET</h2>
          <p className="text-gray-600">관리자 계정 생성</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
              placeholder="관리자 이메일을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
              placeholder="이름을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
              placeholder="연락처를 입력하세요"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#059669] hover:bg-[#047857] text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#059669] disabled:opacity-50"
          >
            {loading ? '계정 생성 중...' : '관리자 계정 생성'}
          </button>
        </form>
      </div>
    </div>
  );
}; 