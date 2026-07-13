import LoginForm from '@/components/auth/LoginForm';
import { isGoogleOAuthConfigured } from '@/lib/googleOAuth';

export default function LoginPage() {
  return <LoginForm googleEnabled={isGoogleOAuthConfigured()} />;
}
