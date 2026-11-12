import { api } from './api';

export const taskApi = {
  /** Filters: project, status, priority, assignee, due, q, sort, page, limit, view */
  list: (params) => api.get('/tasks', { params }).then((r) => r.data),
  create: (data) => api.post('/tasks', data).then((r) => r.data.task),
  get: (id) => api.get(`/tasks/${id}`).then((r) => r.data),
  update: (id, data) => api.patch(`/tasks/${id}`, data).then((r) => r.data.task),
  remove: (id) => api.delete(`/tasks/${id}`),
  /** Kanban drag & drop: [{ id, status, position, previousStatus }] */
  reorder: (workspace, updates) =>
    api.put('/tasks/reorder', { workspace, updates }).then((r) => r.data),
  addComment: (id, body) => api.post(`/tasks/${id}/comments`, { body }).then((r) => r.data.comment),
  addSubtask: (id, title) => api.post(`/tasks/${id}/subtasks`, { title }).then((r) => r.data.subtask),
  updateSubtask: (id, subtaskId, data) =>
    api.patch(`/tasks/${id}/subtasks/${subtaskId}`, data).then((r) => r.data.subtask),
  removeSubtask: (id, subtaskId) => api.delete(`/tasks/${id}/subtasks/${subtaskId}`),
};
