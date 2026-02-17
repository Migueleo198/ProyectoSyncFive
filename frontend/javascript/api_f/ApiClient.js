import { API_BASE_PATH } from '../../config/apiConfig.js';

class ApiClient {
  async request(method, url, data = null) {
    const options = {
      method,
      credentials: 'include', // 🔑 sesiones PHP
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data !== null) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(API_BASE_PATH + url, options);

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { message: 'Error de comunicación con el servidor' };
      }
      throw error;
    }

    return response.status === 204 ? null : response.json();
  }

  get(url) {
    return this.request('GET', url);
  }

  post(url, data) {
    return this.request('POST', url, data);
  }

  put(url, data) {
    return this.request('PUT', url, data);
  }

  patch(url, data) {
    return this.request('PATCH', url, data);
  }

  delete(url) {
    return this.request('DELETE', url);
  }
}

export default new ApiClient();
