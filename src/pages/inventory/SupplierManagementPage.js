import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';

export const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getSuppliers();
      setSuppliers(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('공급업체 목록을 불러오는데 실패했습니다.');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedSupplier) {
        await inventoryService.updateSupplier(selectedSupplier.id, formData);
      } else {
        await inventoryService.createSupplier(formData);
      }
      await fetchSuppliers();
      setIsModalOpen(false);
      setSelectedSupplier(null);
      setFormData({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || '공급업체 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 공급업체를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await inventoryService.deleteSupplier(id);
      await fetchSuppliers();
    } catch (err) {
      setError('공급업체 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">공급업체 관리</h1>
        <button
          onClick={() => {
            setSelectedSupplier(null);
            setFormData({
              name: '',
              contact_name: '',
              phone: '',
              email: '',
              address: '',
              notes: ''
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047857]"
        >
          공급업체 추가
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
                업체명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  로딩중...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  등록된 공급업체가 없습니다.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                  <td className="px-6 py-4">{supplier.contact_name}</td>
                  <td className="px-6 py-4">{supplier.phone}</td>
                  <td className="px-6 py-4">{supplier.email}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setFormData({
                          name: supplier.name,
                          contact_name: supplier.contact_name,
                          phone: supplier.phone,
                          email: supplier.email,
                          address: supplier.address,
                          notes: supplier.notes
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
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
          <div className="bg-white rounded-lg w-[600px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedSupplier ? '공급업체 수정' : '공급업체 추가'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">업체명 *</label>
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
                  <label className="block text-sm mb-1">담당자명 *</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">연락처 *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">이메일</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">주소</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">비고</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
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
                  {loading ? '처리중...' : selectedSupplier ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
