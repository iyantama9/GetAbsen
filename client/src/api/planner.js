import api from './client';

export const getPlannerEvents = (params) => api.get('/planner/events', { params });
export const createPlannerEvent = (data) => api.post('/planner/events', data);
export const updatePlannerEvent = (id, data) => api.put(`/planner/events/${id}`, data);
export const deletePlannerEvent = (id) => api.delete(`/planner/events/${id}`);
