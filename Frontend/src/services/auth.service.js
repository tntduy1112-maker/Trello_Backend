import api from '../api/axiosInstance'

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const verifyEmail = (data) => api.post('/auth/verify-email', data)
export const resendVerification = (data) => api.post('/auth/resend-verification', data)
export const forgotPassword = (data) => api.post('/auth/forgot-password', data)
export const resetPassword = (data) => api.post('/auth/reset-password', data)
export const refreshToken = (data) => api.post('/auth/refresh', data)
export const getMe = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')
export const updateMe = (formData) => api.put('/auth/me', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
