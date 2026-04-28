import api from './axios'

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (fullName, email, password) =>
  api.post('/auth/register', { fullName, email, password })