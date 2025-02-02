import axios from './config/axiosConfig';

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


// 비밀번호 정책 검증 함수
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호는 최소 1개의 대문자를 포함해야 합니다.');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호는 최소 1개의 소문자를 포함해야 합니다.');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호는 최소 1개의 숫자를 포함해야 합니다.');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('비밀번호는 최소 1개의 특수문자(!@#$%^&*)를 포함해야 합니다.');
  }
  
  return errors;
};

const createErrorMessage = (error) => {
  return error.response?.data?.message || '로그인에 실패했습니다.';
};

export const accountService = {
  // 로그인
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

  // 토큰 갱신
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post('/accounts/token/refresh/', { refresh: refreshToken });
      const { access } = response.data;
      tokenManager.setTokens(access, null);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: createErrorMessage(error)
      };
    }
  },

  // 로그아웃
  async logout() {
    try {
      await axios.post('/accounts/logout/');
      tokenManager.clearTokens();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 토큰 검증
  async verifyToken(token) {
    const response = await axios.post('/accounts/token/verify/', { token });
    return response.data;
  },

  // 2단계 인증
  async verify2FA(method, token) {
    try {
      const response = await axios.post(`/accounts/2fa/verify/${method}/`, { token });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  // 2단계 인증 코드 요청
  async request2FACode(method) {
    const response = await axios.post(`/accounts/2fa/request/${method}/`);
    return response.data;
  },

  // 사용자 목록 조회
  async getUsers() {
    try {
      const response = await axios.get('/accounts/users/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || '사용자 목록을 불러오는데 실패했습니다.'
      };
    }
  },

  // 사용자 상세 조회
  async getUser(id) {
    const response = await axios.get(`/accounts/users/${id}/`);
    return response.data;
  },

  // 사용자 생성
  async createUser(data) {
    try {
      // 비밀번호 정책 검증
      const passwordErrors = validatePassword(data.password);
      if (passwordErrors.length > 0) {
        return {
          success: false,
          error: passwordErrors.join('\n')
        };
      }

      const response = await axios.post('/accounts/users/', data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || '사용자 생성에 실패했습니다.'
      };
    }
  },

  // 사용자 정보 수정
  async updateUser(id, data) {
    const response = await axios.put(`/accounts/users/${id}/`, data);
    return response.data;
  },

  // 사용자 삭제
  async deleteUser(id) {
    await axios.delete(`/accounts/users/${id}/`);
  },

  // 비밀번호 변경
  async changePassword(id, data) {
    await axios.post(`/accounts/users/${id}/change-password/`, data);
  }
};