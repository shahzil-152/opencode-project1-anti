import { api } from './api';

export const projectApi = {
  list: (workspace) => api.get('/projects', { params: { workspace } }).then((r) => r.data),
  create: (data) => api.post('/projects', data).then((r) => r.data.project),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data.project),
  update: (id, data) => api.patch(`/projects/${id}`, data).then((r) => r.data.project),
  remove: (id) => api.delete(`/projects/${id}`),
};
