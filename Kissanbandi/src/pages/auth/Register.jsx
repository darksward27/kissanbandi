import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Phone, MapPin, CreditCard, Building2, ArrowLeft, Loader } from 'lucide-react';
import api from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    alternatePhone: '',
    gst: '',
    role: 'user',
    address: {
      street: '',
      locality: '',
      city: '',
      state: '',
      pincode: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return false;
    }

    const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please provide a valid Indian phone number');
      return false;
    }

    if (formData.alternatePhone && !phoneRegex.test(formData.alternatePhone)) {
      toast.error('Please provide a valid Indian alternate phone number');
      return false;
    }

    if (isBusinessAccount && !formData.gst) {
      toast.error('GST number is required for business accounts');
      return false;
    }

    if (formData.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst)) {
      toast.error('Please provide a valid GST number');
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (formData.address.pincode && !pincodeRegex.test(formData.address.pincode)) {
      toast.error('Please provide a valid 6-digit pincode');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { confirmPassword, ...submitData } = formData;
      submitData.role = isBusinessAccount ? 'business' : 'user';
      
      const response = await api.post('/users/register', submitData);
      setRegistered(true);
      toast.success('Registration successful!');
      
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('kissanbandi_token', response.data.token);
        localStorage.setItem('kissanbandi_user', JSON.stringify(response.data.user));
      }
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // if (registered) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  //       <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
  //         <div>
  //           <div className="flex justify-center">
  //             <div className="bg-green-100 p-3 rounded-xl">
  //               <Mail className="h-12 w-12 text-green-600" />
  //             </div>
  //           </div>
  //           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
  //             Check your email
  //           </h2>
  //           <p className="mt-2 text-center text-sm text-gray-600">
  //             We've sent a verification link to {formData.email}
  //           </p>
  //           <p className="mt-2 text-center text-sm text-gray-500">
  //             Please verify your email address to complete the registration process
  //           </p>
  //           <p className="mt-4 text-center text-sm text-gray-500">
  //             Redirecting to login page in a few seconds...
  //           </p>
  //         </div>
  //         <div className="text-center">
  //           <Link
  //             to="/login"
  //             className="inline-flex items-center font-medium text-green-600 hover:text-green-500"
  //           >
  //             <ArrowLeft className="mr-2 h-4 w-4" />
  //             Return to login
  //           </Link>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-green-600 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 px-12 text-white">
          <h2 className="text-4xl font-bold mb-6">Join KissanBandi Today</h2>
          <p className="text-lg mb-8">Create an account to start buying fresh produce directly from farmers.</p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <User className="h-6 w-6" />
              </div>
              <p>Get personalized recommendations</p>
            </div>
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <MapPin className="h-6 w-6" />
              </div>
              <p>Track your orders in real-time</p>
            </div>
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <CreditCard className="h-6 w-6" />
              </div>
              <p>Secure payment options</p>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/10"></div>
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/10"></div>
      </div>

      {/* Right side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <User className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-green-600 hover:text-green-500 inline-flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" /> Sign in here
              </Link>
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            {/* Account Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsBusinessAccount(false)}
                  className={`p-4 text-center rounded-lg border ${
                    !isBusinessAccount
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <User className="h-6 w-6 mx-auto mb-2" />
                  <span className="block font-medium">Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBusinessAccount(true)}
                  className={`p-4 text-center rounded-lg border ${
                    isBusinessAccount
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <Building2 className="h-6 w-6 mx-auto mb-2" />
                  <span className="block font-medium">Business</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Create password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="alternate-phone" className="block text-sm font-medium text-gray-700">
                      Alternate Phone (Optional)
                    </label>
                    <div className="mt-1">
                      <input
                        id="alternate-phone"
                        name="alternatePhone"
                        type="tel"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="+91 9876543210"
                        value={formData.alternatePhone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ID Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Identification</h3>
                {isBusinessAccount && (
                  <div>
                    <label htmlFor="gst" className="block text-sm font-medium text-gray-700">
                      GST Number
                    </label>
                    <div className="mt-1">
                      <input
                        id="gst"
                        name="gst"
                        type="text"
                        required={isBusinessAccount}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Enter GST number"
                        value={formData.gst}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Address</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <div className="mt-1">
                      <input
                        id="street"
                        name="address.street"
                        type="text"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Enter street address"
                        value={formData.address.street}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="locality" className="block text-sm font-medium text-gray-700">
                      Locality/Area
                    </label>
                    <div className="mt-1">
                      <input
                        id="locality"
                        name="address.locality"
                        type="text"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Enter locality or area"
                        value={formData.address.locality}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <div className="mt-1">
                        <input
                          id="city"
                          name="address.city"
                          type="text"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="Enter city"
                          value={formData.address.city}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                        Pincode
                      </label>
                      <div className="mt-1">
                        <input
                          id="pincode"
                          name="address.pincode"
                          type="text"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="6-digit pincode"
                          value={formData.address.pincode}
                          onChange={handleChange}
                          pattern="^\d{6}$"
                          title="Please enter a valid 6-digit pincode"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <div className="mt-1">
                      <select
                        id="state"
                        name="address.state"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        value={formData.address.state}
                        onChange={handleChange}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <Loader className="animate-spin h-5 w-5" />
                  ) : (
                    'Create Account'
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

export default Register; 