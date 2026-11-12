import { api } from './api';

export const invitationApi = {
  getByToken: (token) => api.get(`/invitations/${token}`).then((r) => r.data.invitation),
  accept: (token) => api.post(`/invitations/${token}/accept`).then((r) => r.data),
};
