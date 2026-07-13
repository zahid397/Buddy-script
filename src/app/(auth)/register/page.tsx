'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { registerFormSchema, type RegisterFormInput } from '@/lib/validation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({ resolver: zodResolver(registerFormSchema) });

  const onSubmit = async (data: RegisterFormInput) => {
    setSubmitting(true);
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      toast.success('Account created!');
      router.push('/feed');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
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
      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <img src="/assets/js/images/registration.png" alt="Buddy Script" />
                </div>
                <div className="_social_registration_right_image_dark">
                  <img src="/assets/js/images/registration1.png" alt="Buddy Script" />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">
                <div className="_social_registration_right_logo _mar_b28">
                  <Image src="/assets/js/images/logo.svg" alt="Buddy Script" width={140} height={32} className="_right_logo" priority />
                </div>
                <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
                <h4 className="_social_registration_content_title _titl4 _mar_b50">Registration</h4>
                <button
                  type="button"
                  className="_social_registration_content_btn _mar_b40"
                  onClick={() => toast("Google sign-up isn't part of this demo scope.", { icon: '🚧' })}
                >
                  <img src="/assets/js/images/google.svg" alt="" className="_google_img" /> <span>Register with google</span>
                </button>
                <div className="_social_registration_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>
                <form className="_social_registration_form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="row">
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8" htmlFor="reg-firstName">
                          First Name
                        </label>
                        <input
                          id="reg-firstName"
                          type="text"
                          className="form-control _social_registration_input"
                          placeholder="Jane"
                          autoComplete="given-name"
                          {...register('firstName')}
                        />
                        {errors.firstName ? <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p> : null}
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8" htmlFor="reg-lastName">
                          Last Name
                        </label>
                        <input
                          id="reg-lastName"
                          type="text"
                          className="form-control _social_registration_input"
                          placeholder="Doe"
                          autoComplete="family-name"
                          {...register('lastName')}
                        />
                        {errors.lastName ? <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p> : null}
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8" htmlFor="reg-email">
                          Email
                        </label>
                        <input
                          id="reg-email"
                          type="email"
                          className="form-control _social_registration_input"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...register('email')}
                        />
                        {errors.email ? <p className="text-red-600 text-sm mt-1">{errors.email.message}</p> : null}
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8" htmlFor="reg-password">
                          Password
                        </label>
                        <input
                          id="reg-password"
                          type="password"
                          className="form-control _social_registration_input"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...register('password')}
                        />
                        {errors.password ? <p className="text-red-600 text-sm mt-1">{errors.password.message}</p> : null}
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8" htmlFor="reg-confirmPassword">
                          Repeat Password
                        </label>
                        <input
                          id="reg-confirmPassword"
                          type="password"
                          className="form-control _social_registration_input"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...register('confirmPassword')}
                        />
                        {errors.confirmPassword ? (
                          <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                      <div className="form-check _social_registration_form_check">
                        <input
                          className="form-check-input _social_registration_form_check_input"
                          type="checkbox"
                          id="agreeToTerms"
                          {...register('agreeToTerms')}
                        />
                        <label className="form-check-label _social_registration_form_check_label" htmlFor="agreeToTerms">
                          I agree to terms &amp; conditions
                        </label>
                      </div>
                      {errors.agreeToTerms ? <p className="text-red-600 text-sm mt-1">{errors.agreeToTerms.message}</p> : null}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                      <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                        <button type="submit" className="_social_registration_form_btn_link _btn1" disabled={submitting}>
                          {submitting ? 'Creating account…' : 'Register'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">
                        Already have an account? <Link href="/login">Login</Link>
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
