import { api } from './api';

export const searchApi = {
  search: (q, workspace) => api.get('/search', { params: { q, workspace } }).then((r) => r.data),
};
