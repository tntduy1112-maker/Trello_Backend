import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getMe } from '../../services/auth.service'

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await getMe()
    return res.data.data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired')
  }
})

const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
})()

const initialState = {
  user: storedUser || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(action.payload))
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      })
  },
})

export const { setCredentials, logout, setLoading, updateUser } = authSlice.actions
export default authSlice.reducer
