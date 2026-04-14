import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCredentials, logout as logoutAction, setLoading } from '../redux/slices/authSlice'
import * as authService from '../services/auth.service'

export function useAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, token, isAuthenticated, loading } = useSelector((state) => state.auth)

  const login = async (email, password) => {
    dispatch(setLoading(true))
    try {
      const response = await authService.login({ email, password })
      const { user, token } = response.data
      dispatch(setCredentials({ user, token }))
      navigate('/home')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Đăng nhập thất bại' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const logout = () => {
    dispatch(logoutAction())
    navigate('/login')
  }

  return { user, token, isAuthenticated, loading, login, logout }
}
