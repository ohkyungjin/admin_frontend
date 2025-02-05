import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { inventoryService } from '../../services/inventoryService';

export const PackageFormModal = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  editingPackage, 
  categories,
  categoryItems,
  onCategoryItemsLoad
}) => {
  const [form] = Form.useForm();

  // 초기 카테고리 아이템 로드
  useEffect(() => {
    const loadCategoryItems = async () => {
      if (visible && categories.length > 0) {
        for (const category of categories) {
          try {
            const itemsResponse = await inventoryService.getItems({ category: category.id });
            onCategoryItemsLoad(category.id, itemsResponse?.results || []);
          } catch (error) {
            console.error(`카테고리 ${category.name} 아이템 조회 오류:`, error);
          }
        }
      }
    };
    loadCategoryItems();
  }, [visible, categories, onCategoryItemsLoad]);

  // 수정 시 폼 데이터 설정
  useEffect(() => {
    if (visible && editingPackage) {
      console.log('수정할 패키지 데이터:', editingPackage);
      
      // 각 카테고리별 선택된 아이템 매핑
      const selectedItems = {};
      categories.forEach(category => {
        // 해당 카테고리에 선택된 아이템이 있는지 확인
        const foundItem = editingPackage.items?.find(item => 
          item.category.id === category.id
        );
        // 아이템이 있으면 해당 아이템 ID를, 없으면 빈 문자열("")을 설정
        selectedItems[category.id] = foundItem ? foundItem.default_item.id : "";
      });

      const formValues = {
        name: editingPackage.name,
        description: editingPackage.description,
        total_price: editingPackage.price,
        selected_items: selectedItems
      };
      
      console.log('설정할 폼 데이터:', formValues);
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
    }
  }, [visible, editingPackage, form, categories]);

  const handleCategoryChange = async (categoryId) => {
    try {
      if (!categoryItems[categoryId] || categoryItems[categoryId].length === 0) {
        const itemsResponse = await inventoryService.getItems({ category: categoryId });
        console.log(`카테고리 ${categoryId} 아이템 조회 결과:`, itemsResponse);
        onCategoryItemsLoad(categoryId, itemsResponse?.results || []);
      }
    } catch (error) {
      console.error('카테고리 아이템 조회 오류:', error);
      message.error('카테고리 아이템을 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (values) => {
    try {
      console.log('Form values:', values);
      
      const submitData = {
        name: values.name,
        description: values.description,
        price: values.total_price?.toString() || "0",
        items_data: Object.entries(values.selected_items || {})
          .filter(([_, itemId]) => itemId !== "") // 빈 문자열 필터링
          .map(([categoryId, itemId]) => ({
            category_id: parseInt(categoryId),
            default_item_id: parseInt(itemId),
            is_required: true
          })),
        is_active: true,
        items: []  // 백엔드 요구사항에 맞춰 빈 배열 추가
      };

      console.log('API request data:', submitData);
      await onSubmit(submitData);
      message.success('패키지가 성공적으로 저장되었습니다.');
      onCancel();  // 성공 시 모달 닫기
    } catch (error) {
      console.error('패키지 저장 오류:', error);
      message.error('패키지 저장에 실패했습니다.');
    }
  };

  return (
    <Modal
      title={
        <h2 className="text-2xl font-bold text-blue-800">
          {editingPackage ? '패키지 수정' : '패키지 추가'}
        </h2>
      }
      open={visible}
      onOk={form.submit}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      destroyOnClose
      maskClosable={false}
      className="max-w-2xl"
      okButtonProps={{ 
        className: "!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
      }}
      cancelButtonProps={{ 
        className: "!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="패키지명"
          rules={[{ required: true, message: '패키지명을 입력해주세요' }]}
          className="mb-4"
        >
          <Input className="w-full rounded-md" />
        </Form.Item>

        {categories.map(category => (
          <Form.Item
            key={category.id}
            name={['selected_items', category.id.toString()]}
            label={category.name}
            className="mb-4"
          >
            <Select
              allowClear
              placeholder={`${category.name} 선택`}
              onChange={() => handleCategoryChange(category.id)}
              options={[
                { value: "", label: '없음' },
                ...(categoryItems[category.id]?.map(item => ({
                  value: item.id,
                  label: `${item.name} (${item.unit_price}원)`
                })) || [])
              ]}
              className="w-full"
            />
          </Form.Item>
        ))}

        <Form.Item
          name="total_price"
          label="총 가격"
          rules={[{ required: true, message: '총 가격을 입력해주세요' }]}
          className="mb-4"
        >
          <InputNumber
            className="w-full"
            min={0}
            step={1000}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
            addonAfter="원"
            onChange={(value) => {
              console.log('InputNumber onChange value:', value);
              console.log('InputNumber onChange value type:', typeof value);
            }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="설명"
          rules={[{ required: true, message: '설명을 입력해주세요' }]}
          className="mb-4"
        >
          <Input.TextArea 
            rows={4} 
            className="w-full rounded-md"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}; 