import axios from 'axios';

export const HR_API = 'http://localhost:5000/api/hr-manager';

export const hrAuthConfig = () => {
  const token = localStorage.getItem('accessToken');

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const hrGet = (url) => {
  return axios.get(`${HR_API}${url}`, hrAuthConfig());
};

export const hrPost = (url, data) => {
  return axios.post(`${HR_API}${url}`, data, hrAuthConfig());
};

export const hrPut = (url, data) => {
  return axios.put(`${HR_API}${url}`, data, hrAuthConfig());
};

export const hrDelete = (url) => {
  return axios.delete(`${HR_API}${url}`, hrAuthConfig());
};

export default {
  HR_API,
  hrAuthConfig,
  hrGet,
  hrPost,
  hrPut,
  hrDelete,
};
