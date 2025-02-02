import axios from './config/axiosConfig';

// 패키지 관리 API
export const getPackages = () => axios.get('/funeral/packages/');
export const createPackage = (data) => axios.post('/funeral/packages/', data);
export const getPackageById = (id) => axios.get(`/funeral/packages/${id}/`);
export const updatePackage = (id, data) => axios.put(`/funeral/packages/${id}/`, data);
export const deletePackage = (id) => axios.delete(`/funeral/packages/${id}/`);
export const addPackageItem = (id, data) => axios.post(`/funeral/packages/${id}/add_item/`, data);

// 패키지 품목 관리 API
export const getPackageItems = () => axios.get('/funeral/package-items/');
export const createPackageItem = (data) => axios.post('/funeral/package-items/', data);
export const getPackageItemById = (id) => axios.get(`/funeral/package-items/${id}/`);
export const updatePackageItem = (id, data) => axios.put(`/funeral/package-items/${id}/`, data);
export const deletePackageItem = (id) => axios.delete(`/funeral/package-items/${id}/`);
export const addPackageItemOption = (id, data) => axios.post(`/funeral/package-items/${id}/add_option/`, data);

// 프리미엄 라인 관리 API
export const getPremiumLines = () => axios.get('/funeral/premium-lines/');
export const createPremiumLine = (data) => axios.post('/funeral/premium-lines/', data);
export const getPremiumLineById = (id) => axios.get(`/funeral/premium-lines/${id}/`);
export const updatePremiumLine = (id, data) => axios.put(`/funeral/premium-lines/${id}/`, data);
export const deletePremiumLine = (id) => axios.delete(`/funeral/premium-lines/${id}/`);
export const addPremiumLineItem = (id, data) => axios.post(`/funeral/premium-lines/${id}/add_item/`, data);

// 추가 옵션 관리 API
export const getAdditionalOptions = () => axios.get('/funeral/additional-options/');
export const createAdditionalOption = (data) => axios.post('/funeral/additional-options/', data);
export const getAdditionalOptionById = (id) => axios.get(`/funeral/additional-options/${id}/`);
export const updateAdditionalOption = (id, data) => axios.put(`/funeral/additional-options/${id}/`, data);
export const deleteAdditionalOption = (id) => axios.delete(`/funeral/additional-options/${id}/`);