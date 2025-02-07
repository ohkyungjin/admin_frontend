import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, message } from 'antd';
import axios from 'axios';

export const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isFuneralOpen, setIsFuneralOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('/accounts/users/me/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUserData(response.data);
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
        if (error.response) {
          switch (error.response.status) {
            case 401:
              message.error('인증이 만료되었습니다. 다시 로그인해주세요.');
              navigate('/login');
              break;
            case 403:
              message.error('접근 권한이 없습니다.');
              navigate('/login');
              break;
            case 404:
              message.error('사용자 정보를 찾을 수 없습니다.');
              navigate('/login');
              break;
            default:
              message.error('서버 오류가 발생했습니다.');
          }
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUserData(null);
    navigate('/login');
  };

  const menuItems = [
    { name: '대시보드', path: '/dashboard', icon: '📊' },
    {
      name: '예약 관리',
      icon: '📅',
      subItems: [
        { name: '예약 현황', path: '/reservations', icon: '📆' },
        { name: '추모실 관리', path: '/reservations/memorial-rooms', icon: '🏛️' },
      ],
    },
    {
      name: '재고 관리',
      icon: '📦',
      subItems: [
        { name: '카테고리 관리', path: '/inventory/categories', icon: '🏷️' },
        { name: '공급업체 관리', path: '/inventory/suppliers', icon: '🏢' },
        { name: '재고 품목 관리', path: '/inventory/items', icon: '📋' },
        { name: '재고 이동 관리', path: '/inventory/movements', icon: '🔄' },
        { name: '구매 주문 관리', path: '/inventory/orders', icon: '🛍️' },
      ],
    },
    {
      name: '장례 서비스',
      icon: '🕊️',
      subItems: [
        { name: '패키지 관리', path: '/funeral/packages', icon: '📦' },
        { name: '프리미엄 라인', path: '/funeral/premium-lines', icon: '⭐' },
        { name: '추가 옵션', path: '/funeral/additional-options', icon: '➕' },
      ],
    },
    { name: '계정 관리', path: '/account/management', icon: '👥' },
    { name: '시스템 설정', path: '/settings', icon: '⚙️' },
  ];


  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Top Navigation */}
      <nav className="bg-white shadow-lg fixed w-full z-30">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Button
                  type="text"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ☰
                </Button>
                <span className="ml-4 text-xl font-bold text-blue-800">CIELO PET</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <Button
                  type="text"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <span className="h-8 w-8 rounded-full bg-blue-800 text-white flex items-center justify-center">
                    👤
                  </span>
                  <span className="font-medium">
                    {userData ? `${userData.name}` : '로딩 중...'}
                  </span>
                </Button>
                {isProfileMenuOpen && (
                  <Card className="absolute right-0 mt-2 w-48 !p-0">
                    <div className="px-4 py-2 text-sm text-gray-600 border-b">
                      {userData?.email}
                    </div>
                    <Button
                      type="text"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      로그아웃
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } bg-white w-64 transition-transform duration-300 ease-in-out z-20 shadow-lg pt-16 md:z-0`}>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  <div>
                    <Button
                      type="text"
                      onClick={() => {
                        if (item.name === '재고 관리') setIsInventoryOpen(!isInventoryOpen);
                        if (item.name === '장례 서비스') setIsFuneralOpen(!isFuneralOpen);
                        if (item.name === '예약 관리') setIsReservationOpen(!isReservationOpen);
                      }}
                      className={`flex justify-between items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                        (item.name === '재고 관리' && location.pathname.startsWith('/inventory')) ||
                        (item.name === '장례 서비스' && location.pathname.startsWith('/funeral')) ||
                        (item.name === '예약 관리' && location.pathname.startsWith('/reservations')) ||
                        (item.name === '추모 관리' && location.pathname.startsWith('/memorials'))
                          ? 'bg-gray-100'
                          : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <span>
                        {(item.name === '재고 관리' && isInventoryOpen) ||
                        (item.name === '장례 서비스' && isFuneralOpen) ||
                        (item.name === '예약 관리' && isReservationOpen)
                          ? '▼'
                          : '▲'}
                      </span>
                    </Button>
                    {((item.name === '재고 관리' && isInventoryOpen) ||
                      (item.name === '장례 서비스' && isFuneralOpen) ||
                      (item.name === '예약 관리' && isReservationOpen)) && (
                      <div className="ml-8 space-y-1 mt-1">
                        {item.subItems.map((subItem) => (
                          <Button
                            key={subItem.path}
                            type="text"
                            onClick={() => navigate(subItem.path)}
                            className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md ${
                              location.pathname === subItem.path ? 'bg-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="mr-3">{subItem.icon}</span>
                              <span>{subItem.name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    type="text"
                    onClick={() => navigate(item.path)}
                    className={`flex justify-between items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                      location.pathname === item.path ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    <span className="opacity-0">▲</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'md:ml-64' : 'ml-0'
      } pt-16 bg-[#F8F9FA]`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};