import { api } from './api';

export const activityApi = {
  list: (params) => api.get('/activity', { params }).then((r) => r.data.data),
};
