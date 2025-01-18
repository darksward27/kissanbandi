import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../../services/api';

const EmailVerification = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const { token } = useParams();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        toast.error('Verification token is missing');
        return;
      }

      try {
        console.log('Attempting to verify email with token:', token);
        const response = await api.get(`/users/verify-email/${token}`);
        console.log('Verification response:', response.data);
        setStatus('success');
        toast.success('Email verified successfully!');
      } catch (err) {
        console.error('Verification error:', err.response?.data || err.message);
        setStatus('error');
        toast.error(
          err.response?.data?.error || 
          err.response?.data?.message || 
          'Email verification failed'
        );
      }
    };

    verifyEmail();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader className="h-12 w-12 text-green-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your email
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Sign In
            </Link>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              The verification link is invalid or has expired. Please try registering again.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Register Again
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default EmailVerification; 