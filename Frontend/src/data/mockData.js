export const mockUser = {
  id: '1',
  full_name: 'Nguyễn Văn An',
  email: 'an@example.com',
  avatar_url: null,
}

export const mockWorkspaces = [
  {
    id: '1',
    name: 'Công ty ABC',
    slug: 'cong-ty-abc',
    description: 'Workspace cho team phát triển',
    logo_url: null,
    role: 'owner',
    member_count: 5,
  },
  {
    id: '2',
    name: 'Dự án Cá nhân',
    slug: 'du-an-ca-nhan',
    description: null,
    logo_url: null,
    role: 'owner',
    member_count: 1,
  },
]

export const mockBoards = [
  { id: '1', name: 'Sprint Q1 2025', cover_color: '#0052CC', visibility: 'workspace', is_starred: true },
  { id: '2', name: 'Marketing Campaign', cover_color: '#00875A', visibility: 'private', is_starred: false },
  { id: '3', name: 'Bug Tracker', cover_color: '#DE350B', visibility: 'workspace', is_starred: false },
  { id: '4', name: 'Roadmap 2025', cover_color: '#6554C0', visibility: 'public', is_starred: false },
]

export const mockLists = [
  { id: 'l1', name: 'To Do', position: 1 },
  { id: 'l2', name: 'In Progress', position: 2 },
  { id: 'l3', name: 'Review', position: 3 },
  { id: 'l4', name: 'Done', position: 4 },
]

export const mockCards = {
  l1: [
    {
      id: 'c1',
      title: 'Thiết kế database schema',
      description: 'Cần hoàn thành ERD trước cuối tuần',
      priority: 'high',
      due_date: '2025-02-15',
      cover_color: '#0052CC',
      labels: [{ color: '#0052CC', name: 'Backend' }],
      assignees: [mockUser],
      checklist_progress: { completed: 2, total: 5 },
      comments: [
        { id: 'cm1', user: mockUser, content: 'Đã xem qua, cần thêm index cho bảng users', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      ],
      attachments: [],
    },
    {
      id: 'c2',
      title: 'Setup CI/CD pipeline',
      description: null,
      priority: 'medium',
      due_date: null,
      cover_color: null,
      labels: [{ color: '#00875A', name: 'DevOps' }],
      assignees: [],
      checklist_progress: null,
      comments: [],
      attachments: [],
    },
    {
      id: 'c3',
      title: 'Viết unit tests cho auth module',
      description: null,
      priority: 'low',
      due_date: '2025-02-20',
      cover_color: null,
      labels: [],
      assignees: [mockUser],
      checklist_progress: { completed: 0, total: 3 },
      comments: [],
      attachments: [],
    },
  ],
  l2: [
    {
      id: 'c4',
      title: 'Implement JWT authentication',
      description: 'Access token 15m, refresh token 7d',
      priority: 'critical',
      due_date: '2025-02-10',
      cover_color: '#FF5630',
      labels: [
        { color: '#0052CC', name: 'Backend' },
        { color: '#FF5630', name: 'Security' },
      ],
      assignees: [mockUser],
      checklist_progress: { completed: 3, total: 4 },
      comments: [],
      attachments: [],
    },
    {
      id: 'c5',
      title: 'Build Kanban board UI',
      description: null,
      priority: 'high',
      due_date: '2025-02-12',
      cover_color: null,
      labels: [{ color: '#6554C0', name: 'Frontend' }],
      assignees: [mockUser],
      checklist_progress: { completed: 1, total: 6 },
      comments: [],
      attachments: [],
    },
  ],
  l3: [
    {
      id: 'c6',
      title: 'Code review: Board API',
      description: null,
      priority: 'medium',
      due_date: null,
      cover_color: null,
      labels: [{ color: '#0052CC', name: 'Backend' }],
      assignees: [],
      checklist_progress: null,
      comments: [],
      attachments: [],
    },
  ],
  l4: [
    {
      id: 'c7',
      title: 'Setup Docker Compose',
      description: 'PostgreSQL + Node.js containers',
      priority: 'medium',
      due_date: '2025-01-30',
      cover_color: '#00875A',
      labels: [{ color: '#00875A', name: 'DevOps' }],
      assignees: [mockUser],
      checklist_progress: { completed: 3, total: 3 },
      comments: [],
      attachments: [],
    },
    {
      id: 'c8',
      title: 'Database migrations',
      description: null,
      priority: 'low',
      due_date: '2025-01-28',
      cover_color: null,
      labels: [{ color: '#0052CC', name: 'Backend' }],
      assignees: [],
      checklist_progress: null,
      comments: [],
      attachments: [],
    },
  ],
}

export const mockNotifications = [
  {
    id: '1',
    type: 'card_assigned',
    title: 'Được giao việc mới',
    message: 'Bạn được assign vào card "Implement JWT authentication"',
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '2',
    type: 'comment_added',
    title: 'Bình luận mới',
    message: 'Trần Thị B commented on "Build Kanban board UI"',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'due_date_reminder',
    title: 'Sắp đến deadline',
    message: 'Card "Board API" đến hạn ngày mai',
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

export const mockMembers = [
  { id: '1', full_name: 'Nguyễn Văn An', email: 'an@example.com', avatar_url: null, role: 'owner' },
  { id: '2', full_name: 'Trần Thị B', email: 'b@example.com', avatar_url: null, role: 'admin' },
  { id: '3', full_name: 'Lê Văn C', email: 'c@example.com', avatar_url: null, role: 'member' },
  { id: '4', full_name: 'Phạm Thị D', email: 'd@example.com', avatar_url: null, role: 'member' },
  { id: '5', full_name: 'Hoàng Văn E', email: 'e@example.com', avatar_url: null, role: 'member' },
]
