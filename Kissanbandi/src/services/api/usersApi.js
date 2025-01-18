// Admin Authentication
export const adminLogin = async ({ email, password }) => {
  try {
    const response = await axios.post('/api/users/admin/login', { email, password });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}; 