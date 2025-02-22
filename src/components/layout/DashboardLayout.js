import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, message } from 'antd';
import axios from '../../services/config/axiosConfig';

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
// 토큰 갱신을 기다리는 요청들의 큐
let refreshSubscribers = [];

// 토큰 갱신이 완료되면 대기 중인 요청들을 처리
const onRefreshed = (token) => {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
};

// 토큰 갱신을 기다리는 요청을 큐에 추가
const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

export const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isFuneralOpen, setIsFuneralOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setUserData(null);
    navigate('/login');
  }, [navigate]);

  const validateUserData = useCallback((data) => {
    return data && 
           typeof data === 'object' && 
           'auth_level' in data && 
           'name' in data && 
           'email' in data;
  }, []);

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await axios.get('/accounts/users/me/');
      const fetchedUserData = response.data;
      
      if (!validateUserData(fetchedUserData)) {
        throw new Error('Invalid user data format');
      }

      localStorage.setItem('user_info', JSON.stringify(fetchedUserData));
      setUserData(fetchedUserData);
      return true;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return false;
    }
  }, [validateUserData]);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const userInfo = localStorage.getItem('user_info');
      
      try {
        if (!token) {
          handleLogout();
          return;
        }

        let currentUserData;
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          if (validateUserData(parsedUserInfo)) {
            currentUserData = parsedUserInfo;
          }
        }

        if (!currentUserData) {
          const success = await fetchUserInfo();
          if (!success) {
            handleLogout();
            return;
          }
        } else {
          setUserData(currentUserData);
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [navigate, handleLogout, validateUserData, fetchUserInfo]);

  // 에러 이벤트 리스너 등록
  useEffect(() => {
    const handleError = (event) => {
      message.error(event.detail.message);
    };

    window.addEventListener('app:error', handleError);
    return () => window.removeEventListener('app:error', handleError);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // axios 인터셉터 설정
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // 토큰 갱신 요청에서 에러가 발생한 경우
        if (error.response?.status === 401 && originalRequest.url.includes('token/refresh')) {
          handleLogout();
          return Promise.reject(error);
        }

        // 401 에러이고 토큰 갱신을 시도하지 않은 요청인 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            // 토큰 갱신 중이면 새 토큰을 받을 때까지 대기
            try {
              const token = await new Promise(resolve => {
                addRefreshSubscriber(token => {
                  resolve(token);
                });
              });
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            } catch (err) {
              return Promise.reject(err);
            }
          }

          // 토큰 갱신 시작
          isRefreshing = true;
          originalRequest._retry = true;

          try {
            const refresh = localStorage.getItem('refresh_token');
            const response = await axios.post('/accounts/token/refresh/', {
              refresh
            });

            const newToken = response.data.access;
            localStorage.setItem('access_token', newToken);
            
            // 토큰 갱신 후 사용자 정보도 갱신
            await fetchUserInfo();
            
            // 대기 중인 요청들에게 새 토큰 전달
            onRefreshed(newToken);
            
            // 현재 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            isRefreshing = false;
            return axios(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            refreshSubscribers = [];
            
            if (refreshError.response?.data?.code === 'token_not_valid') {
              message.error('세션이 만료되었습니다. 다시 로그인해주세요.');
            } else {
              message.error('인증에 실패했습니다. 다시 로그인해주세요.');
            }
            handleLogout();
            return Promise.reject(refreshError);
          }
        }

        // 다른 에러 처리
        if (error.response?.status === 403) {
          message.error('접근 권한이 없습니다.');
        } else if (error.response?.data?.detail) {
          message.error(error.response.data.detail);
        } else {
          message.error('요청 처리 중 오류가 발생했습니다.');
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [handleLogout, fetchUserInfo]);

  const menuItems = useMemo(() => [
    { 
      name: '대시보드', 
      path: '/dashboard', 
      icon: '📊',
      minAuthLevel: 1
    },
    { 
      name: '예약 관리', 
      path: '', 
      icon: '📆',
      minAuthLevel: 2,
      subItems: [
        { name: '예약 캘린더', path: '/reservations/calendar', icon: '📅' },
        { name: '예약 리스트', path: '/reservations', icon: '📋' },
      ],
    },
    {
      name: '재고 관리',
      icon: '📦',
      minAuthLevel: 2,
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
      minAuthLevel: 2,
      subItems: [
        { name: '패키지 관리', path: '/funeral/packages', icon: '📦' },
        { name: '프리미엄 라인', path: '/funeral/premium-lines', icon: '⭐' },
        { name: '추가 옵션', path: '/funeral/additional-options', icon: '➕' },
        { name: '추모실 관리', path: '/reservations/memorial-rooms', icon: '🏛️' },
      ],
    },
    { 
      name: '계정 관리', 
      path: '/account/management', 
      icon: '👥',
      minAuthLevel: 2
    },
    { 
      name: '시스템 설정', 
      path: '/settings', 
      icon: '⚙️',
      minAuthLevel: 2
    },
  ], []);

  // 권한이 없는 페이지 접근 시 대시보드로 리다이렉트
  useEffect(() => {
    if (!userData || location.pathname === '/dashboard') return;

    const currentPath = location.pathname;
    const currentMenu = menuItems.find(item => 
      item.path === currentPath || 
      (item.subItems && item.subItems.some(subItem => subItem.path === currentPath))
    );

    // 현재 페이지에 대한 메뉴 항목이 있고, 권한이 부족한 경우에만 리다이렉트
    if (currentMenu && (userData.auth_level < currentMenu.minAuthLevel)) {
      navigate('/dashboard');
      message.error('접근 권한이 없습니다.');
    }
  }, [location.pathname, userData, navigate, menuItems]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-800"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Top Navigation */}
      <nav className="bg-white shadow-lg fixed w-full z-30">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                {(userData?.auth_level || 0) > 1 && (
                  <Button
                    type="text"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ☰
                  </Button>
                )}
                <span className={`text-xl font-bold text-blue-800 ${(userData?.auth_level || 0) > 1 ? 'ml-4' : ''}`}>CIELO PET</span>
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

      {/* Sidebar - Only show if auth_level > 1 */}
      {(userData?.auth_level || 0) > 1 && (
        <>
          {/* Overlay for mobile */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

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
        </>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ease-in-out ${
        (userData?.auth_level || 0) > 1 ? (isSidebarOpen ? 'md:ml-64' : 'ml-0') : ''
      } pt-16 bg-[#F8F9FA]`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};