'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const { login, demoLogin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      await login(data);
      toast.success('Welcome back!');
      router.push('/feed');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoSubmitting(true);
    try {
      await demoLogin();
      toast.success('Signed in with a demo account');
      router.push('/feed');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to start demo session');
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <section className="_social_login_wrapper _layout_main_wrapper">
      <div className="_shape_one">
        <img src="/assets/js/images/shape1.svg" alt="" className="_shape_img" />
        <img src="/assets/js/images/dark_shape.svg" alt="" className="_dark_shape" />
      </div>
      <div className="_shape_two">
        <img src="/assets/js/images/shape2.svg" alt="" className="_shape_img" />
        <img src="/assets/js/images/dark_shape1.svg" alt="" className="_dark_shape _dark_shape_opacity" />
      </div>
      <div className="_shape_three">
        <img src="/assets/js/images/shape3.svg" alt="" className="_shape_img" />
        <img src="/assets/js/images/dark_shape2.svg" alt="" className="_dark_shape _dark_shape_opacity" />
      </div>
      <div className="_social_login_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_login_left">
                <div className="_social_login_left_image">
                  <img src="/assets/js/images/login.png" alt="Buddy Script" className="_left_img" />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_login_content">
                <div className="_social_login_left_logo _mar_b28">
                  <Image src="/assets/js/images/logo.svg" alt="Buddy Script" width={140} height={32} className="_left_logo" priority />
                </div>
                <p className="_social_login_content_para _mar_b8">Welcome back</p>
                <h4 className="_social_login_content_title _titl4 _mar_b50">Login to your account</h4>

                {googleEnabled ? (
                  <a href="/api/auth/google" className="_social_login_content_btn _mar_b40">
                    <img src="/assets/js/images/google.svg" alt="" className="_google_img" /> <span>Continue with Google</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={demoSubmitting}
                    className="_social_login_content_btn _mar_b40"
                  >
                    <Sparkles size={18} color="#1890FF" />{' '}
                    <span>{demoSubmitting ? 'Starting demo session…' : 'Continue with Demo Account'}</span>
                  </button>
                )}
                {!googleEnabled ? (
                  <p className="text-xs text-gray-400 -mt-6 mb-6">
                    Signs you in as a fictional demo persona — not a real Google account. Demo Mode only.
                  </p>
                ) : null}

                <div className="_social_login_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>
                <form className="_social_login_form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_login_form_input _mar_b14">
                        <label className="_social_login_label _mar_b8" htmlFor="login-email">
                          Email
                        </label>
                        <input
                          id="login-email"
                          type="email"
                          className="form-control _social_login_input"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...register('email')}
                        />
                        {errors.email ? <p className="text-red-600 text-sm mt-1">{errors.email.message}</p> : null}
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_login_form_input _mar_b14">
                        <label className="_social_login_label _mar_b8" htmlFor="login-password">
                          Password
                        </label>
                        <input
                          id="login-password"
                          type="password"
                          className="form-control _social_login_input"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...register('password')}
                        />
                        {errors.password ? <p className="text-red-600 text-sm mt-1">{errors.password.message}</p> : null}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                      <div className="form-check _social_login_form_check">
                        <input
                          className="form-check-input _social_login_form_check_input"
                          type="checkbox"
                          id="rememberMe"
                          defaultChecked
                        />
                        <label className="form-check-label _social_login_form_check_label" htmlFor="rememberMe">
                          Remember me
                        </label>
                      </div>
                    </div>
                    <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                      <div className="_social_login_form_left">
                        <button
                          type="button"
                          className="_social_login_form_left_para"
                          style={{ background: 'none', border: 0, cursor: 'pointer' }}
                          onClick={() => toast("Password reset isn't part of this demo scope.", { icon: '🚧' })}
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                      <div className="_social_login_form_btn _mar_t40 _mar_b60">
                        <button type="submit" className="_social_login_form_btn_link _btn1" disabled={submitting}>
                          {submitting ? 'Logging in…' : 'Login now'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_login_bottom_txt">
                      <p className="_social_login_bottom_txt_para">
                        Dont have an account? <Link href="/register">Create New Account</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
