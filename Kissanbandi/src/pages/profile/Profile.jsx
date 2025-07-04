import React, { useState } from 'react';
import { useAuth } from '../checkout/AuthProvider';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Building2, Save, Loader } from 'lucide-react';
import api from '../../services/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    alternatePhone: user?.alternatePhone || '',
    address: {
      street: user?.address?.street || '',
      locality: user?.address?.locality || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    }
  });

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
    const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please provide a valid Indian phone number');
      return false;
    }

    if (formData.alternatePhone && !phoneRegex.test(formData.alternatePhone)) {
      toast.error('Please provide a valid Indian alternate phone number');
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
      const response = await api.put('/users/profile', formData);
      if (response.data) {
        await updateUser(response.data);
        toast.success('Profile updated successfully');
      } else {
        toast.error('Unable to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error('An error occurred while updating profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8 mt-32">
        <div className="max-w-3xl mx-auto">
          {/* Header Animation */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg mb-4 animate-bounce duration-2000">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-green-700 mt-2">Manage your account settings and preferences</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8 hover:shadow-2xl transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-medium text-green-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white"
                    />
                  </div>
                  
                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-medium text-green-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="flex-1 px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm bg-green-50 text-green-600"
                      />
                      {user?.isEmailVerified && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-800">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="phone" className="block text-sm font-medium text-green-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  
                  <div className="group">
                    <label htmlFor="alternatePhone" className="block text-sm font-medium text-green-700 mb-2">
                      Alternate Phone (Optional)
                    </label>
                    <input
                      id="alternatePhone"
                      name="alternatePhone"
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-teal-100 to-green-100 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-teal-800">Address Information</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="group">
                    <label htmlFor="address.street" className="block text-sm font-medium text-green-700 mb-2">
                      Street Address
                    </label>
                    <input
                      id="address.street"
                      name="address.street"
                      type="text"
                      required
                      value={formData.address.street}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white"
                    />
                  </div>
                  
                  <div className="group">
                    <label htmlFor="address.locality" className="block text-sm font-medium text-green-700 mb-2">
                      Locality/Area
                    </label>
                    <input
                      id="address.locality"
                      name="address.locality"
                      type="text"
                      required
                      value={formData.address.locality}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group">
                      <label htmlFor="address.city" className="block text-sm font-medium text-green-700 mb-2">
                        City
                      </label>
                      <input
                        id="address.city"
                        name="address.city"
                        type="text"
                        required
                        value={formData.address.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white"
                      />
                    </div>
                    
                    <div className="group">
                      <label htmlFor="address.state" className="block text-sm font-medium text-green-700 mb-2">
                        State
                      </label>
                      <select
                        id="address.state"
                        name="address.state"
                        required
                        value={formData.address.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="group">
                      <label htmlFor="address.pincode" className="block text-sm font-medium text-green-700 mb-2">
                        Pincode
                      </label>
                      <input
                        id="address.pincode"
                        name="address.pincode"
                        type="text"
                        required
                        value={formData.address.pincode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 group-hover:border-green-300 bg-white"
                        placeholder="6-digit pincode"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-3" />
                      Save Changes
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

export default Profile;