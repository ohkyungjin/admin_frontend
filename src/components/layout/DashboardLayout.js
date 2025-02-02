import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isFuneralOpen, setIsFuneralOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { name: '대시보드', path: '/dashboard', icon: '📊' },
    { name: '예약 관리', path: '/reservations', icon: '📅' },
    {
      name: '재고 관리',
      icon: '📦',
      subItems: [
        { name: '카테고리 관리', path: '/inventory/categories' },
        { name: '공급업체 관리', path: '/inventory/suppliers' },
        { name: '재고 품목 관리', path: '/inventory/items' },
        { name: '재고 이동 관리', path: '/inventory/movements' },
        { name: '구매 주문 관리', path: '/inventory/orders' },
      ],
    },
    {
      name: '장례 서비스',
      icon: '🕊️',
      subItems: [
        { name: '패키지 관리', path: '/funeral/packages' },
        { name: '프리미엄 라인', path: '/funeral/premium-lines' },
        { name: '추가 옵션', path: '/funeral/additional-options' },
      ],
    },
    { name: '추모 관리', path: '/memorials', icon: '💐' },
    { name: '계정 관리', path: '/account/management', icon: '👥' },
    { name: '시스템 설정', path: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  ☰
                </button>
                <span className="ml-4 text-xl font-bold text-[#059669]">CIELO PET</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <span className="h-8 w-8 rounded-full bg-[#059669] text-white flex items-center justify-center">
                    👤
                  </span>
                  <span>관리자</span>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white w-64 transition-transform duration-300 ease-in-out z-0 shadow-sm pt-16`}>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => {
                        if (item.name === '재고 관리') setIsInventoryOpen(!isInventoryOpen);
                        if (item.name === '장례 서비스') setIsFuneralOpen(!isFuneralOpen);
                      }}
                      className={`flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                        (item.name === '재고 관리' && location.pathname.startsWith('/inventory')) ||
                        (item.name === '장례 서비스' && location.pathname.startsWith('/funeral')) ||
                        (item.name === '추모 관리' && location.pathname.startsWith('/memorials'))
                          ? 'bg-gray-100'
                          : ''
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.name}</span>
                      <span className="ml-auto">
                        {(item.name === '재고 관리' && isInventoryOpen) ||
                        (item.name === '장례 서비스' && isFuneralOpen)
                          ? '▼'
                          : '▲'}
                      </span>
                    </button>
                    {((item.name === '재고 관리' && isInventoryOpen) ||
                      (item.name === '장례 서비스' && isFuneralOpen)) && (
                      <div className="ml-8 space-y-1 mt-1">
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.path}
                            onClick={() => navigate(subItem.path)}
                            className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md ${
                              location.pathname === subItem.path ? 'bg-gray-100' : ''
                            }`}
                          >
                            {subItem.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(item.path)}
                    className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                      location.pathname === item.path ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};