import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

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

    // 401 에러 처리 (토큰 만료)
    if (error.response.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/accounts/token/', { refresh: refreshToken });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          error.config.headers.Authorization = `Bearer ${access}`;
          return axios(error.config);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
