// src/services/api.js
// PURPOSE: Central place for ALL backend API calls.
// Every component imports from here — no component
// writes fetch/axios directly.
// The axios instance automatically attaches the JWT token
// to every request from localStorage.

import axios from 'axios'

// Base URL — vite proxy forwards /api → http://localhost:5000/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

// ── Request interceptor: attach JWT token automatically ───────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('lems_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: handle 401 globally ─────────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lems_token')
      localStorage.removeItem('lems_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  getMe: () =>
    api.get('/auth/me'),
}

// ════════════════════════════════════════════════════════
// FIR
// ════════════════════════════════════════════════════════
export const firAPI = {
  getAll:  (params) => api.get('/fir', { params }),
  getById: (id)     => api.get(`/fir/${id}`),
  create:  (data)   => api.post('/fir', data),          // calls file_fir() SP
  updateStatus: (id, status) => api.put(`/fir/${id}/status`, { status }),
}

// ════════════════════════════════════════════════════════
// CASES
// ════════════════════════════════════════════════════════
export const caseAPI = {
  getAll:      (params) => api.get('/cases', { params }),
  getTimeline: ()       => api.get('/cases/timeline'),
  getById:     (id)     => api.get(`/cases/${id}`),
  updatePriority: (id, priority) => api.put(`/cases/${id}/priority`, { priority }),
  close:       (id)     => api.put(`/cases/${id}/close`),   // calls close_case() SP
  assignOfficer: (id, officer_id, role) =>
    api.post(`/cases/${id}/officers`, { officer_id, role }),
  addVictim:   (id, data) => api.post(`/cases/${id}/victims`,   data),
  addWitness:  (id, data) => api.post(`/cases/${id}/witnesses`,  data),
  addLog:      (id, data) => api.post(`/cases/${id}/log`,        data),
}

// ════════════════════════════════════════════════════════
// OFFICERS
// ════════════════════════════════════════════════════════
export const officerAPI = {
  getAll:      (params) => api.get('/officers', { params }),
  getWorkload: (params) => api.get('/officers/workload', { params }),
  getRanks:    ()       => api.get('/officers/ranks'),
  getById:     (id)     => api.get(`/officers/${id}`),
  create:      (data)   => api.post('/officers', data),
  updateStatus: (id, status) => api.put(`/officers/${id}/status`, { status }),
}

// ════════════════════════════════════════════════════════
// SUSPECTS
// ════════════════════════════════════════════════════════
export const suspectAPI = {
  getAll:   (params) => api.get('/suspects', { params }),
  getById:  (id)     => api.get(`/suspects/${id}`),
  create:   (data)   => api.post('/suspects', data),
  linkToCase: (id, case_id, involvement_level) =>
    api.post(`/suspects/${id}/link`, { case_id, involvement_level }),
  arrest:   (data)   => api.post('/suspects/arrest', data), // calls arrest_suspect() SP
}

// ════════════════════════════════════════════════════════
// EVIDENCE
// ════════════════════════════════════════════════════════
export const evidenceAPI = {
  getAll:       (params) => api.get('/evidence', { params }),
  getById:      (id)     => api.get(`/evidence/${id}`),
  create:       (data)   => api.post('/evidence', data),
  updateStatus: (id, status) => api.put(`/evidence/${id}/status`, { status }),
  delete:       (id)     => api.delete(`/evidence/${id}`),  // Trigger 2 may block
}

// ════════════════════════════════════════════════════════
// CHARGES
// ════════════════════════════════════════════════════════
export const chargeAPI = {
  getLegalSections: () => api.get('/charges/legal-sections'),
  getAll:    (params) => api.get('/charges', { params }),
  create:    (data)   => api.post('/charges', data),
  updateStatus: (id, status) => api.put(`/charges/${id}/status`, { status }),
}

// ════════════════════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════════════════════
export const reportAPI = {
  getDashboard:    () => api.get('/reports/dashboard'),
  getStationReport:(id) => api.get(`/reports/station/${id}`),
}

// ════════════════════════════════════════════════════════
// UTILITY
// ════════════════════════════════════════════════════════
export const utilAPI = {
  getDistricts: () => api.get('/districts'),
  getStations:  () => api.get('/stations'),
}

export default api
