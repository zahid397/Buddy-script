import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfilePosts from '@/components/profile/ProfilePosts';

export default function ProfilePage({ params }: { params: { userId: string } }) {
  return (
    <>
      <ProfileHeader userId={params.userId} />
      <ProfilePosts userId={params.userId} />
    </>
  );
}
