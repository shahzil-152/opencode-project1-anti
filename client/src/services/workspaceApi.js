import { api } from './api';

export const workspaceApi = {
  list: () => api.get('/workspaces').then((r) => r.data.data),
  create: (data) => api.post('/workspaces', data).then((r) => r.data.workspace),
  get: (id) => api.get(`/workspaces/${id}`).then((r) => r.data),
  update: (id, data) => api.patch(`/workspaces/${id}`, data).then((r) => r.data.workspace),
  remove: (id) => api.delete(`/workspaces/${id}`),
  members: (id) => api.get(`/workspaces/${id}/members`).then((r) => r.data.data),
  updateMember: (workspaceId, userId, role) =>
    api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role }).then((r) => r.data.member),
  removeMember: (workspaceId, userId) =>
    api.delete(`/workspaces/${workspaceId}/members/${userId}`),
  invite: (workspaceId, email, role) =>
    api.post(`/workspaces/${workspaceId}/invitations`, { email, role }).then((r) => r.data),
  listInvitations: (workspaceId) =>
    api.get(`/workspaces/${workspaceId}/invitations`).then((r) => r.data.data),
  revokeInvitation: (workspaceId, invitationId) =>
    api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`),
};
