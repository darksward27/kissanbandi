import React, { useState, useEffect } from 'react';
import { useAuth } from '../checkout/AuthProvider';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Lock, ArrowRight, Loader, EyeIcon, Eye, EyeClosed, Shield, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user is admin and block redirect
      if (user.role === 'admin') {
        console.warn('Admin user detected, blocking automatic redirect');
        toast.error('Admin access is restricted. Please use the admin panel.');
        return; // Don't redirect admin users
      }
      
      // Only redirect non-admin users
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Attempt login first
      const loginResult = await login(email, password, rememberMe);
      
      // Check if the user role is admin and restrict access
      if (loginResult && loginResult.user && loginResult.user.role === 'admin') {
        // Force logout the admin user
        console.warn('Admin login attempt blocked:', loginResult.user.email);
        
        // Show error message
        toast.error('Admin access is restricted. Please use the admin panel.');
        
        // Clear the login state
        // Note: You might need to add a logout method to your auth context
        // await logout(); // Uncomment this if you have a logout method
        
        // Clear form fields and stay on login page
        setEmail('');
        setPassword('');
        setRememberMe(false);
        
        return;
      }
      
      // If not admin, proceed with normal login flow
      toast.success('Login successful');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if the error is specifically about admin restriction
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      
      if (errorMessage.toLowerCase().includes('admin') || 
          errorMessage.toLowerCase().includes('restricted') ||
          err.response?.data?.role === 'admin') {
        toast.error('Admin access is restricted. Please use the admin panel.');
        
        // Clear form fields for admin restriction
        setEmail('');
        setPassword('');
        setRememberMe(false);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Section with brown theme */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-700 via-orange-700 to-yellow-700 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 px-12 text-white">
          <h2 className="text-4xl font-bold mb-6">Welcome to Bogat</h2>
          <p className="text-lg mb-8">Connect directly with premium suppliers and get quality products delivered to your doorstep.</p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <User className="h-6 w-6" />
              </div>
              <p>Access your personalized dashboard</p>
            </div>
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <Lock className="h-6 w-6" />
              </div>
              <p>Secure and encrypted transactions</p>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/10"></div>
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/10"></div>
      </div>

      {/* Right side - Login Form with brown theme */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <div className="bg-amber-100 p-3 rounded-xl border border-amber-200">
                <User className="h-12 w-12 text-amber-700" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link to="/register" className="font-medium text-amber-600 hover:text-amber-500 inline-flex items-center transition-colors duration-200">
                create a new account <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-amber-200 p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-amber-200 rounded-md shadow-sm placeholder-gray-600 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm hover:border-amber-300 transition-colors duration-200"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-amber-200 rounded-md shadow-sm placeholder-gray-600 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm pr-10 hover:border-amber-300 transition-colors duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-2 mt-6 flex items-center px-2 text-amber-600 hover:text-amber-700 transition-colors duration-200"
                  >
                    {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeClosed className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded transition-colors duration-200"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-amber-600 hover:text-amber-500 transition-colors duration-200">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <Loader className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-amber-200 group-hover:text-amber-100 transition-colors duration-200" />
                      </span>
                      Sign in
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;