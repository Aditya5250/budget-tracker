import api from './axios'

export async function signupApi(data) {
  const res = await api.post('/auth/signup', data)
  return res.data
}

export async function loginApi(data) {
  const res = await api.post('/auth/login', data)
  return res.data
}