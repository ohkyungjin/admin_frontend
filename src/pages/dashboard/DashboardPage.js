import React from 'react';

export const DashboardPage = () => {
  return (
      <div className="space-y-6">
        {/* 상단 퀵 스탯 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-[#D1FAE5] text-[#059669]">📅</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">오늘의 예약</p>
                <p className="text-2xl font-semibold text-gray-900">0건</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-[#D1FAE5] text-[#059669]">🕊️</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">진행중인 장례</p>
                <p className="text-2xl font-semibold text-gray-900">0건</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-[#D1FAE5] text-[#059669]">⚡</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">긴급 요청</p>
                <p className="text-2xl font-semibold text-gray-900">0건</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-[#D1FAE5] text-[#059669]">📦</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">재고 부족</p>
                <p className="text-2xl font-semibold text-gray-900">0건</p>
              </div>
            </div>
          </div>
        </div>

        {/* 추모실 현황 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">추모실 현황</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700">추모실 1</h4>
                <p className="mt-2 text-sm text-gray-500">현재 상태: 사용 가능</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700">추모실 2</h4>
                <p className="mt-2 text-sm text-gray-500">현재 상태: 사용 가능</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700">추모실 3</h4>
                <p className="mt-2 text-sm text-gray-500">현재 상태: 사용 가능</p>
              </div>
            </div>
          </div>
        </div>

        {/* 오늘의 일정 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">오늘의 일정</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              예정된 일정이 없습니다.
            </div>
          </div>
        </div>
      </div>
  );
}; 