import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// axios 기본 설정
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// 토큰 관리 함수
const tokenManager = {
  setTokens: (access, refresh) => {
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
  },
  
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token')
};

// 요청 인터셉터 설정
axios.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
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
    const originalRequest = error.config;

    // 네트워크 오류 처리
    if (!error.response) {
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'));
    }

    // 401 에러 처리 (토큰 만료)
    if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/accounts/token/') {
      originalRequest._retry = true;
      
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
          tokenManager.clearTokens();
          return Promise.reject(new Error('로그인이 만료되었습니다. 다시 로그인해주세요.'));
        }

        const response = await accountService.refreshToken(refreshToken);
        if (response.access) {
          tokenManager.setTokens(response.access, null);
          originalRequest.headers.Authorization = `Bearer ${response.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        tokenManager.clearTokens();
        return Promise.reject(new Error('세션이 만료되었습니다. 다시 로그인해주세요.'));
      }
    }

    return Promise.reject(error);
  }
);

// 비밀번호 정책 검증 함수
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

export const accountService = {
  login: async (credentials) => {
    try {
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error('올바른 이메일 형식이 아닙니다.');
      }

      const response = await axios.post('/accounts/token/', {
        email: credentials.email,
        password: credentials.password
      });

      const { access, refresh, user } = response.data;
      
      if (!access) {
        throw new Error('로그인에 실패했습니다. 다시 시도해주세요.');
      }

      // 토큰 및 사용자 정보 저장
      tokenManager.setTokens(access, refresh);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorDetail = error.response?.data?.detail || error.response?.data?.message;

        // 서버 응답 상태에 따른 구체적인 에러 메시지
        switch (status) {
          case 400:
            return Promise.reject(new Error('입력하신 정보를 다시 확인해주세요.'));
          case 401:
            return Promise.reject(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'));
          case 403:
            return Promise.reject(new Error('계정에 접근할 수 없습니다. 관리자에게 문의해주세요.'));
          case 404:
            return Promise.reject(new Error('등록되지 않은 이메일입니다.'));
          case 429:
            return Promise.reject(new Error('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'));
          case 500:
            return Promise.reject(new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
          default:
            return Promise.reject(new Error(errorDetail || '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
        }
      }

      // 이메일 형식 검증 에러
      if (error.message === '올바른 이메일 형식이 아닙니다.') {
        return Promise.reject(error);
      }

      return Promise.reject(new Error('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
    }
  },

  refreshToken: async (refreshToken) => {
    const response = await axios.post('/accounts/token/refresh/', {
      refresh: refreshToken
    });
    return response.data;
  },

  logout: async () => {
    try {
      await axios.post('/accounts/logout/');
    } finally {
      tokenManager.clearTokens();
    }
  },

  verifyToken: async (token) => {
    const response = await axios.post(`/accounts/token/verify/`, {
      token: token
    });
    return response.data;
  },

  verify2FA: async (method, token) => {
    const response = await axios.post(`/accounts/2fa/verify/`, {
      method, // 'sms' or 'email'
      token
    });
    return response.data;
  },

  request2FACode: async (method) => {
    const response = await axios.post(`/accounts/2fa/request/`, {
      method // 'sms' or 'email'
    });
    return response.data;
  },

  getUsers: async () => {
    try {
      const response = await axios.get(`/accounts/users/`);
      // 응답 데이터가 배열이 아닌 경우 처리
      return Array.isArray(response.data) ? response.data : 
             response.data.results ? response.data.results : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getUser: async (id) => {
    const response = await axios.get(`/accounts/users/${id}/`);
    return response.data;
  },

  createUser: async (data) => {
    const response = await axios.post(`/accounts/users/`, {
      email: data.email,
      password: data.password,
      password_confirm: data.password_confirm,
      name: data.name,
      phone: data.phone,
      department: data.department,
      position: data.position,
      auth_level: data.auth_level
    });
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await axios.put(`/accounts/users/${id}/`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    await axios.delete(`/accounts/users/${id}/`);
  },

  changePassword: async (id, data) => {
    await axios.post(`/accounts/users/${id}/change-password/`, data);
  }
}; 