import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as workspaceService from '../../services/workspace.service'

export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await workspaceService.getWorkspaces()
      return res.data.data.organizations
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load workspaces')
    }
  }
)

export const createWorkspaceThunk = createAsyncThunk(
  'workspace/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await workspaceService.createWorkspace(data)
      return res.data.data.organization
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create workspace')
    }
  }
)

export const updateWorkspaceThunk = createAsyncThunk(
  'workspace/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await workspaceService.updateWorkspace(id, data)
      return res.data.data.organization
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update workspace')
    }
  }
)

export const deleteWorkspaceThunk = createAsyncThunk(
  'workspace/delete',
  async (id, { rejectWithValue }) => {
    try {
      await workspaceService.deleteWorkspace(id)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete workspace')
    }
  }
)

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    workspaces: [],
    loading: false,
    error: null,
  },
  reducers: {
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false
        state.workspaces = action.payload
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createWorkspaceThunk.fulfilled, (state, action) => {
        state.workspaces.push(action.payload)
      })
      .addCase(updateWorkspaceThunk.fulfilled, (state, action) => {
        const idx = state.workspaces.findIndex((w) => w.id === action.payload.id)
        if (idx !== -1) state.workspaces[idx] = action.payload
      })
      .addCase(deleteWorkspaceThunk.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter((w) => w.id !== action.payload)
      })
  },
})

export const { setWorkspaces } = workspaceSlice.actions
export default workspaceSlice.reducer
