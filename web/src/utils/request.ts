import axios, { AxiosError, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types/user'
import { BASE_URL } from '@/config/api'

// 创建axios实例
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    })
    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    })

    if (response.data.code === 200 || response.data.code === 201) {
      return {
        ...response,
        data: response.data.data
      }
    }
    return Promise.reject(new Error(response.data.message || '请求失败'))
  },
  (error: AxiosError<ApiResponse>) => {
    console.error('Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // 这里可以添加路由跳转到登录页的逻辑
      // router.push('/login')
    }

    // 处理网络错误
    if (!error.response) {
      return Promise.reject(new Error('网络连接失败，请检查服务是否启动'))
    }

    // 返回错误信息
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default request
