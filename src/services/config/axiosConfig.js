import axios from 'axios';

//export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
//export const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.7:8000/api/v1';
export const API_URL = process.env.REACT_APP_API_URL || 'http://172.30.48.1:8000/api/v1';

// axios 기본 설정
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// 요청 인터셉터 설정
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 설정
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'));
    }

    const originalRequest = error.config;

    // 토큰 갱신 요청에서 에러가 발생한 경우
    if (error.response.status === 401 && originalRequest.url.includes('token/refresh')) {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 401 에러이고 토큰 갱신을 시도하지 않은 요청인 경우
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('/accounts/token/refresh/', {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // 새로운 토큰으로 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 다른 에러 처리
    if (error.response.status === 403) {
      window.dispatchEvent(new CustomEvent('app:error', { 
        detail: { message: '접근 권한이 없습니다.' }
      }));
    } else if (error.response?.data?.detail) {
      window.dispatchEvent(new CustomEvent('app:error', { 
        detail: { message: error.response.data.detail }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('app:error', { 
        detail: { message: '요청 처리 중 오류가 발생했습니다.' }
      }));
    }

    return Promise.reject(error);
  }
);

export default axios;
