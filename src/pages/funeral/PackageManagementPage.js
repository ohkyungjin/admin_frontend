import React, { useState, useEffect, useCallback } from 'react';
import { getPackages, createPackage, updatePackage, deletePackage } from '../../services/funeralService';
import { inventoryService } from '../../services/inventoryService';
import { Table, Button, message, Space, Popconfirm, Card } from 'antd';
import { PackageFormModal } from '../../components/funeral/PackageFormModal';

export const PackageManagementPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryItems, setCategoryItems] = useState({});

  // 카테고리 목록 조회
  const fetchCategories = useCallback(async () => {
    try {
      const response = await inventoryService.getCategories();
      const categoriesData = response?.results || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('카테고리 조회 오류:', error);
      message.error('카테고리 정보를 불러오는데 실패했습니다.');
    }
  }, []);

  // 패키지 목록 조회
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPackages();
      const packagesData = response?.data?.results;
      if (Array.isArray(packagesData)) {
        setPackages(packagesData);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('패키지 조회 오류:', error);
      message.error('패키지 목록을 불러오는데 실패했습니다.');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    fetchCategories();
    fetchPackages();
  }, [fetchCategories, fetchPackages]);

  // 모달 닫기 처리
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingPackage(null);
  }, []);

  // 새 패키지 추가 모달 열기
  const handleOpenAddModal = useCallback(() => {
    setEditingPackage(null);
    setModalVisible(true);
  }, []);

  // 패키지 수정 모달 열기
  const handleOpenEditModal = useCallback((record) => {
    setEditingPackage(record);
    setModalVisible(true);
  }, []);

  // 패키지 생성/수정 처리
  const handleSubmit = async (values) => {
    try {
      console.log('PackageManagementPage handleSubmit values:', values);
      console.log('total_price type:', typeof values.total_price);
      console.log('total_price value:', values.total_price);

      // 패키지 데이터 구성
      const packageData = {
        name: values.name,
        description: values.description,
        price: values.price || values.total_price?.toString() || "0",
        items_data: Object.entries(values.selected_items || {})
          .filter(([_, itemId]) => itemId !== "") // 빈 문자열 필터링
          .map(([categoryId, itemId]) => ({
            category_id: parseInt(categoryId),
            default_item_id: parseInt(itemId),
            is_required: true
          })),
        is_active: true,
        items: []
      };

      console.log('최종 전송 데이터:', packageData);

      if (editingPackage) {
        await updatePackage(editingPackage.id, packageData);
        message.success({
          content: `패키지 "${values.name}"이(가) 수정되었습니다.`,
          key: 'package_update'
        });
      } else {
        await createPackage(packageData);
        message.success({
          content: `패키지 "${values.name}"이(가) 생성되었습니다.`,
          key: 'package_create'
        });
      }
      handleCloseModal();
      fetchPackages();
    } catch (error) {
      console.error('패키지 저장 오류:', error);
      message.error({
        content: `패키지 ${editingPackage ? '수정' : '생성'}에 실패했습니다. ${error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : ''}`,
        key: editingPackage ? 'package_update' : 'package_create'
      });
    }
  };

  // 패키지 삭제
  const handleDelete = async (id, name) => {
    try {
      message.loading({
        content: '패키지를 삭제하는 중입니다...',
        key: 'package_delete'
      });
      await deletePackage(id);
      message.success({
        content: `패키지 "${name}"이(가) 삭제되었습니다.`,
        key: 'package_delete'
      });
      fetchPackages();
    } catch (error) {
      console.error('패키지 삭제 오류:', error);
      message.error({
        content: '패키지 삭제에 실패했습니다.',
        key: 'package_delete'
      });
    }
  };

  // 카테고리 아이템 로드 핸들러
  const handleCategoryItemsLoad = useCallback((categoryId, items) => {
    setCategoryItems(prev => ({
      ...prev,
      [categoryId]: items
    }));
  }, []);

  // 테이블 컬럼 설정
  const columns = [
    {
      title: '패키지명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 300,
      render: (text) => (
        <div title={text}>
          {text}
        </div>
      ),
    },
    {
      title: '가격',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price?.toLocaleString()}원`
    },
    {
      title: '관리',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => handleOpenEditModal(record)}
            className="!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
          >
            수정
          </Button>
          <Popconfirm
            title="패키지를 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id, record.name)}
            okText="예"
            cancelText="아니오"
            okButtonProps={{ 
              className: "!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white" 
            }}
            cancelButtonProps={{ 
              className: "!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900" 
            }}
          >
            <Button 
              danger 
              className="!bg-red-500 !border-red-500 hover:!bg-red-600 hover:!border-red-600 !text-white"
            >
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">패키지 관리</h1>
          <Button
            type="primary"
            onClick={handleOpenAddModal}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            새 패키지 추가
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={packages}
          rowKey="id"
          className="w-full"
          loading={loading}
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
            emptyText: '패키지가 없습니다.'
          }}
        />

        <PackageFormModal
          visible={modalVisible}
          onCancel={handleCloseModal}
          onSubmit={handleSubmit}
          editingPackage={editingPackage}
          categories={categories}
          categoryItems={categoryItems}
          onCategoryItemsLoad={handleCategoryItemsLoad}
        />
      </Card>
    </div>
  );
};