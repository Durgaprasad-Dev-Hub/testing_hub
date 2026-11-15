/**
 * API service — all requests to the FastAPI backend.
 * Uses Axios with a base URL pointing to the backend.
 * Never exposes API keys — all AI calls go through the backend.
 */

import axios from 'axios'

const BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Response interceptor for consistent error handling ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ── Health ────────────────────────────────────────────────────────────────────

export const getHealth = () => api.get('/health').then((r) => r.data)

// ── Projects ──────────────────────────────────────────────────────────────────

export const createProject = (data) => api.post('/projects', data).then((r) => r.data)

export const listProjects = (params = {}) =>
  api.get('/projects', { params }).then((r) => r.data)

export const getProject = (id) => api.get(`/projects/${id}`).then((r) => r.data)

export const deleteProject = (id) => api.delete(`/projects/${id}`)

// ── Upload ────────────────────────────────────────────────────────────────────

export const uploadSource = (projectId, file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/projects/${projectId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    },
  }).then((r) => r.data)
}

// ── Scans ─────────────────────────────────────────────────────────────────────

export const startScan = (projectId, data) =>
  api.post(`/projects/${projectId}/scan`, data).then((r) => r.data)

export const listProjectScans = (projectId) =>
  api.get(`/projects/${projectId}/scans`).then((r) => r.data)

export const getScan = (scanId) => api.get(`/scans/${scanId}`).then((r) => r.data)

export const getScanStatus = (scanId) =>
  api.get(`/scans/${scanId}/status`).then((r) => r.data)

// ── Findings ──────────────────────────────────────────────────────────────────

export const listFindings = (projectId, params = {}) =>
  api.get(`/projects/${projectId}/findings`, { params }).then((r) => r.data)

export const getFinding = (findingId) =>
  api.get(`/findings/${findingId}`).then((r) => r.data)

export const explainFinding = (findingId) =>
  api.post(`/findings/${findingId}/explain`).then((r) => r.data)

export const generateFix = (findingId) =>
  api.post(`/findings/${findingId}/generate-fix`).then((r) => r.data)

// ── Patches ───────────────────────────────────────────────────────────────────

export const getPatch = (patchId) => api.get(`/patches/${patchId}`).then((r) => r.data)

export const approvePatch = (patchId, data) =>
  api.post(`/patches/${patchId}/approve`, data).then((r) => r.data)

export const rejectPatch = (patchId, data) =>
  api.post(`/patches/${patchId}/reject`, data).then((r) => r.data)

export const verifyPatch = (patchId) =>
  api.post(`/patches/${patchId}/verify`).then((r) => r.data)

// ── Reports ───────────────────────────────────────────────────────────────────

export const getProjectReport = (projectId, format = 'json') =>
  api.get(`/projects/${projectId}/report`, { params: { format } }).then((r) => r.data)

export default api
