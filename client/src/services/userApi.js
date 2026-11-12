import { api } from './api';

export const userApi = {
  updateProfile: (data) => api.patch('/users/me', data).then((r) => r.data.user),
  changePassword: (data) => api.patch('/users/me/password', data).then((r) => r.data),
  updatePreferences: (data) => api.patch('/users/me/preferences', data).then((r) => r.data.user),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.user);
  },
  deleteAccount: () => api.delete('/users/me').then((r) => r.data),
};
