import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AuthAPI } from '@/api'
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { imageAsset } from '@/utils/asset';

// Logo Component
const Logo = () => (
  <img src={imageAsset('logos/mystock.png')} alt="logo" className="block w-60 mx-auto mb-6" />
);

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors: validationErrors },
  } = useForm();

  const [serverErrors, setServerErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = async (data) => {
    setServerErrors([]);
    setMessage('');
    setMessageStatus('');
    try {
      const res = await AuthAPI.login(data);
      setMessage(res.data.message || 'Login berhasil!');
      setMessageStatus('success');
      setTimeout(() => {
        window.location.href = route('cms.dashboard');
      }, 2000);
    } catch (err) {
      if (err.response) {
        setMessage(err.response.data.message || 'Login gagal');
        setServerErrors(err.response.data.errors || []);
        setMessageStatus('error');
      }
    }
  };

  const getServerError = (field) =>
    serverErrors.find((e) => e.field === field)?.message;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Logo */}
          <Logo />

          {/* Title */}
          <div className="text-center mb-8">
            {/* <h1 className="text-3xl font-bold text-gray-800 mb-2">Sales Management</h1> */}
            {/* <p className="text-gray-600">Masuk ke akun Anda</p> */}
          </div>
          {message && (
            <div className={`mb-6 p-4 rounded-lg text-center font-medium ${messageStatus === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
              <Icon
                icon={messageStatus === 'success' ? 'fluent:checkmark-circle-16-filled' : 'fluent:error-circle-16-filled'}
                className="inline w-5 h-5 mr-2"
              />
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="fluent:mail-16-regular" className="inline w-4 h-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email wajib diisi' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 focus:bg-white"
                placeholder="Masukkan email Anda"
              />
              {(validationErrors.email || getServerError('email')) && (
                <div className="text-sm text-red-500 mt-1 flex items-center">
                  <Icon icon="fluent:error-circle-16-regular" className="w-4 h-4 mr-1" />
                  {validationErrors.email?.message || getServerError('email')}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="fluent:lock-closed-16-regular" className="inline w-4 h-4 mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  {...register('password', { required: 'Password wajib diisi' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 focus:bg-white pr-12"
                  placeholder="Masukkan password Anda"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700 transition duration-200"
                  tabIndex={-1}
                >
                  <Icon icon={showPwd ? 'fluent:eye-off-16-regular' : 'fluent:eye-16-regular'} className="w-5 h-5" />
                </button>
              </div>
              {(validationErrors.password || getServerError('password')) && (
                <div className="text-sm text-red-500 mt-1 flex items-center">
                  <Icon icon="fluent:error-circle-16-regular" className="w-4 h-4 mr-1" />
                  {validationErrors.password?.message || getServerError('password')}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Icon icon="fluent:arrow-right-16-filled" className="inline w-5 h-5 mr-2" />
              Login
            </button>


          </form>
        </div>
      </div>
    </div>
  );
}
