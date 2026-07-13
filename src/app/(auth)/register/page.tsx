import RegisterForm from '@/components/auth/RegisterForm';
import { isGoogleOAuthConfigured } from '@/lib/googleOAuth';

export default function RegisterPage() {
  return <RegisterForm googleEnabled={isGoogleOAuthConfigured()} />;
}
