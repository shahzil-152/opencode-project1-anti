import { api } from './api';

export const dashboardApi = {
  overview: (workspace) => api.get('/dashboard', { params: { workspace } }).then((r) => r.data),
};
