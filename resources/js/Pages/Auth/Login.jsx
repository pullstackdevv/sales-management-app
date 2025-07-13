import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AuthAPI } from '@/api'
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

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
        window.location.reload();
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
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      {message && (
        <div className={`mb-4 ${messageStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* email */}
        <div className="mb-4">
          <label>Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email wajib diisi' })}
            className="w-full border px-3 py-2 rounded"
          />
          {(validationErrors.email || getServerError('email')) && (
            <div className="text-sm ">
              {validationErrors.email?.message || getServerError('email')}
            </div>
          )}
        </div>

        {/* password */}
        <div className="mb-4">
          <label>Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              {...register('password', { required: 'Password wajib diisi' })}
              className="w-full border px-3 py-2 rounded pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
              tabIndex={-1}
            >
              <Icon icon={showPwd ? 'fluent:eye-off-16-regular' : 'fluent:eye-16-regular'} className="w-5 h-5" />
            </button>
          </div>
          {(validationErrors.password || getServerError('password')) && (
            <div className="text-sm text-red-500">
              {validationErrors.password?.message || getServerError('password')}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
        <p className="text-sm text-center mt-4">
          Belum punya akun?{' '}
          <Link
            href={route('auth.register')}
            className="text-blue-600 hover:underline"
          >Daftar</Link>
        </p>
      </form>
    </div>
  );
}
