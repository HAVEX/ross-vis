import axios from 'axios'

const apiClient = axios.create({
  baseURL: `http://localhost:8888`,
  withCredentials: false, // This is the default
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

export default {
  getcpd(algo) {
    return apiClient.get('/events')
  },
  getpca(algo) {
    return apiClient.get('/events/' + id)
  }
}
