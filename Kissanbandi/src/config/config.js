const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  IMAGE_URL: process.env.REACT_APP_IMAGE_URL || 'http://localhost:5000',
  DEFAULT_ERROR_MESSAGE: 'Something went wrong. Please try again later.',
  TOKEN_KEY: 'kissanbandi_token',
  USER_KEY: 'kissanbandi_user',
};

export default config; 