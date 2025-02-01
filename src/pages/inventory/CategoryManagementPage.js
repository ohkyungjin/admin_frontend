import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';

export const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getCategories();
      // response.results가 배열인지 확인하고, 아니면 빈 배열 사용
      setCategories(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('카테고리 목록을 불러오는데 실패했습니다.');
      setCategories([]); // 에러 시 빈 배열로 초기화
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedCategory) {
        await inventoryService.updateCategory(selectedCategory.id, formData);
      } else {
        await inventoryService.createCategory(formData);
      }
      await fetchCategories();
      setIsModalOpen(false);
      setSelectedCategory(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.message || '카테고리 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await inventoryService.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      setError('카테고리 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <button
          onClick={() => {
            setSelectedCategory(null);
            setFormData({ name: '', description: '' });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047857]"
        >
          카테고리 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                카테고리명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                설명
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center">
                  로딩중...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center">
                  등록된 카테고리가 없습니다.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
                  <td className="px-6 py-4">{category.description}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setFormData({
                          name: category.name,
                          description: category.description
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedCategory ? '카테고리 수정' : '카테고리 추가'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">카테고리명</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047857]"
                  disabled={loading}
                >
                  {loading
                    ? '처리중...'
                    : selectedCategory
                    ? '수정'
                    : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
