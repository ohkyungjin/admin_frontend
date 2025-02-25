import React, { useEffect, useState, useCallback } from 'react';
import { Form, InputNumber, Radio } from 'antd';

export const PaymentInfoSection = ({ 
  form, 
  packages, 
  premiumLines, 
  additionalOptions,
  reservation
}) => {
  const [, forceUpdate] = useState({});

  // 총 금액 계산 로직
  const calculateTotalAmount = useCallback(() => {
    const values = form.getFieldsValue();
    let subtotal = 0;

    // 1. 기본 서비스 금액 계산
    const selectedPackage = packages?.find(pkg => pkg.id === values.package_id);
    const packagePrice = Number(selectedPackage?.price || 0);
    subtotal += packagePrice;

    const selectedPremiumLine = premiumLines?.find(line => line.id === values.premium_line_id);
    const premiumLinePrice = Number(selectedPremiumLine?.price || 0);
    subtotal += premiumLinePrice;

    // 추가 서비스 계산
    const selectedAdditionalOptions = values.additional_option_ids?.map(optionId => 
      additionalOptions?.find(opt => opt.id === optionId)
    ).filter(Boolean) || [];
    
    const additionalAmount = selectedAdditionalOptions.reduce((sum, option) => 
      sum + Number(option?.price || 0), 0);
    subtotal += additionalAmount;

    // 체중 추가 금액 계산
    const weightSurcharge = Number(values.weight_surcharge || 0);
    subtotal += weightSurcharge;

    // 2. 할인 적용
    let finalTotal = subtotal;
    let discountAmount = 0;
    if (values.discount_type && values.discount_value) {
      if (values.discount_type === 'percent') {
        discountAmount = Math.round(subtotal * (Number(values.discount_value) / 100));
        finalTotal = subtotal - discountAmount;
      } else if (values.discount_type === 'fixed') {
        discountAmount = Number(values.discount_value);
        finalTotal = Math.max(0, subtotal - discountAmount);
      }
    }

    // 세부 내역 객체 반환
    return {
      total: Math.round(finalTotal),
      subtotal,
      details: {
        package: { name: selectedPackage?.name || '없음', price: packagePrice },
        premiumLine: { name: selectedPremiumLine?.name || '없음', price: premiumLinePrice },
        additionalOptions: selectedAdditionalOptions,
        weightSurcharge,
        discount: discountAmount
      }
    };
  }, [form, packages, premiumLines, additionalOptions]);


  // 서비스 정보 변경 감지
  useEffect(() => {
    const result = calculateTotalAmount();
    form.setFieldsValue({
      total_amount: result.total
    });
    forceUpdate({});
  }, [calculateTotalAmount, form]);

  // 초기 결제 정보 설정
  useEffect(() => {
    if (reservation) {
      console.log(reservation);
      form.setFieldsValue({
        weight_surcharge: reservation.weight_surcharge ? Number(reservation.weight_surcharge) : undefined,
        discount_type: reservation.discount_type || null,
        discount_value: reservation.discount_value ? Number(reservation.discount_value) : undefined,
        total_amount: reservation.total_amount ? Number(reservation.total_amount) : undefined
      });
    }
  }, [reservation, form]);

  const renderDetails = () => {
    const result = calculateTotalAmount();
    const { details, subtotal } = result;
    const weight = form.getFieldValue('pet_weight');

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-100">
        <h4 className="font-medium text-gray-700 pb-3 border-b">결제 상세내역</h4>
        
        <div className="divide-y divide-gray-50">
          {/* 기본 서비스 영역 */}
          <div className="py-3 space-y-2">
            <p className="text-xs font-medium text-gray-400">기본 서비스</p>
            {details.package.price > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✦</span>
                  <span className="text-gray-600">장례 패키지</span>
                  <span className="text-gray-400 text-sm">({details.package.name})</span>
                </div>
                <span className="font-medium">{details.package.price.toLocaleString()}원</span>
              </div>
            )}
            {details.premiumLine.price > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-purple-500">✦</span>
                  <span className="text-gray-600">프리미엄 라인</span>
                  <span className="text-gray-400 text-sm">({details.premiumLine.name})</span>
                </div>
                <span className="font-medium">{details.premiumLine.price.toLocaleString()}원</span>
              </div>
            )}
          </div>

          {/* 추가 서비스 영역 */}
          {((details.additionalOptions?.length > 0) || (weight > 10 && details.weightSurcharge > 0)) && (
            <div className="py-3 space-y-2">
              <p className="text-xs font-medium text-gray-400">추가 서비스</p>
              {details.additionalOptions?.map((option, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">✦</span>
                    <span className="text-gray-600">{option.name}</span>
                  </div>
                  <span className="font-medium">{Number(option.price).toLocaleString()}원</span>
                </div>
              ))}
              {weight > 10 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✦</span>
                    <span className="text-gray-600">체중 추가 금액</span>
                    <span className="text-gray-400 text-sm">({weight}kg)</span>
                  </div>
                  <span className="font-medium">{details.weightSurcharge.toLocaleString()}원</span>
                </div>
              )}
            </div>
          )}

          {/* 소계 및 할인 영역 */}
          <div className="py-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">소계</span>
              <span className="font-medium">{subtotal.toLocaleString()}원</span>
            </div>

            {details.discount > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">✦</span>
                  <span className="text-red-500">할인</span>
                </div>
                <span className="font-medium text-red-500">-{details.discount.toLocaleString()}원</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleValuesChange = useCallback((changedValues) => {
    // 체중이 변경되었고 15kg 이상인 경우 weight_surcharge 필드를 초기화
    if ('pet_weight' in changedValues) {
      const weight = changedValues.pet_weight;
      if (weight > 15) {
        form.setFieldsValue({ weight_surcharge: 0 });
      }
    }
    
    const result = calculateTotalAmount();
    form.setFieldsValue({
      total_amount: result.total
    });

    forceUpdate({});
  }, [calculateTotalAmount, form]);

  return (
    <Form 
      form={form}
      onValuesChange={handleValuesChange}
    >
      <div className="bg-gray-50 p-6 rounded-xl space-y-6">
        <h3 className="text-lg font-medium text-gray-800">결제 정보</h3>

        {/* 체중 추가 금액과 할인 영역 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 체중 추가 금액 영역 */}
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="mb-3">
              <span className="text-gray-700 font-medium">체중 추가 금액</span>
              <div className="text-sm text-gray-500 mt-1">
                현재 체중: {form.getFieldValue('pet_weight') || 0}kg
              </div>
            </div>

            <Form.Item
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.pet_weight !== currentValues.pet_weight
              }
            >
              {({ getFieldValue }) => {
                const weight = getFieldValue('pet_weight');
                if (!weight || weight <= 10) {
                  return (
                    <div className="text-sm text-gray-500">
                      10kg 이하는 추가 금액이 없습니다.
                    </div>
                  );
                }
                return (
                  <Form.Item name="weight_surcharge" noStyle>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={10000}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder="추가 금액 입력"
                      addonAfter="원"
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </div>

          {/* 할인 옵션 */}
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="mb-3">
              <span className="text-gray-700 font-medium">할인 적용</span>
              <Form.Item name="discount_type" className="mt-1 mb-8">
                <Radio.Group>
                  <Radio value={null}>없음</Radio>
                  <Radio value="percent">%</Radio>
                  <Radio value="fixed">원</Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            <Form.Item
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.discount_type !== currentValues.discount_type
              }
            >
              {({ getFieldValue }) => {
                const discountType = getFieldValue('discount_type');
                if (!discountType) {
                  return (
                    <div className="text-sm text-gray-500">
                      할인이 적용되지 않습니다.
                    </div>
                  );
                }
                return (
                  <Form.Item name="discount_value" noStyle>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={discountType === 'percent' ? 100 : undefined}
                      formatter={value => discountType === 'fixed' ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : value}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder={discountType === 'percent' ? '할인율 입력' : '할인금액 입력'}
                      addonAfter={discountType === 'percent' ? '%' : '원'}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </div>
        </div>

        {/* 세부 내역 표시 */}
        {renderDetails()}

        {/* 최종 금액 */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-blue-800">최종 금액</span>
            <div className="text-2xl font-bold text-blue-800">
              {calculateTotalAmount().total.toLocaleString()}
              <span className="ml-1 text-lg">원</span>
            </div>
          </div>
        </div>

        <Form.Item name="total_amount" hidden>
          <InputNumber />
        </Form.Item>
      </div>
    </Form>
  );
};