import ApiClient from './ApiClient.js';

const AuthApi = {

  login(data) {
    return ApiClient.post('/auth/login', data);
  },

  logout() {
    return ApiClient.post('/auth/logout');
  },

  me() {
    return ApiClient.get('/auth/me');
  },

  recoverPassword(data) {
    return ApiClient.patch('/auth/recuperar-contrasena', data);
  },

  changePassword(data) {
    return ApiClient.patch('/auth/cambiar-contrasena', data);
  },
   
  activateAccount(token) {
    return ApiClient.patch(`/auth/activar-cuenta?token=${token}`);
  }

};

export default AuthApi;
