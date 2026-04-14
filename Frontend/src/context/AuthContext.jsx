import React, { createContext, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setCredentials, logout as logoutAction } from '../redux/slices/authSlice'
import * as authService from '../services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const { user, token, isAuthenticated, loading } = useSelector((state) => state.auth)

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password })
      const { user, token } = response.data
      dispatch(setCredentials({ user, token }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Đăng nhập thất bại' }
    }
  }

  const logout = () => {
    dispatch(logoutAction())
  }

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
