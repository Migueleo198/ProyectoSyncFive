const BASE_URL = '/api/localidades';

const LocalidadApi = {
  getAll: () => fetch(BASE_URL).then(res => res.json())
};

export default LocalidadApi;