'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { Globe, Image as ImageIcon, Lock, Send, Users, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost } from '@/hooks/usePosts';
import { apiFetch, ApiError } from '@/lib/api';
import type { PostVisibility } from '@/types';

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string; icon: typeof Globe }[] = [
  { value: 'PUBLIC', label: 'Public', icon: Globe },
  { value: 'FRIENDS', label: 'Friends', icon: Users },
  { value: 'PRIVATE', label: 'Only me', icon: Lock },
];

export default function CreatePost() {
  const { user } = useAuth();
  const createPost = useCreatePost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const clearImage = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      let imageBlurHash: string | null = null;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await apiFetch<{ url: string; blurHash: string | null }>('/api/upload', {
          method: 'POST',
          body: formData,
        });
        imageUrl = uploadRes.url;
        imageBlurHash = uploadRes.blurHash;
      }

      await createPost.mutateAsync({ content: content.trim(), imageUrl, imageBlurHash, visibility });
      setContent('');
      clearImage();
      setVisibility('PUBLIC');
      toast.success('Post shared!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
      <div className="_feed_inner_text_area_box">
        <div className="_feed_inner_text_area_box_image">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.firstName} className="_txt_img" />
          ) : null}
        </div>
        <div className="_feed_inner_text_area_box_form" style={{ flex: 1 }}>
          <textarea
            className="form-control _textarea"
            placeholder="Write something ..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {previewUrl ? (
        <div className="relative mt-3 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Selected attachment" className="max-h-52 rounded-card object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -right-2 -top-2 rounded-full bg-gray-900/70 p-1 text-white"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="_feed_inner_text_area_bottom">
        <div className="_feed_inner_text_area_item">
          <div className="_feed_inner_text_area_bottom_photo _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                <ImageIcon size={18} />
              </span>
              Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={handleFileSelect}
            />
          </div>
          <div className="ml-3 flex items-center gap-1 rounded-md bg-gray-50 p-0.5">
            {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                  visibility === value ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="_feed_inner_text_area_btn">
          <button
            type="button"
            className="_feed_inner_text_area_btn_link"
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && !file)}
          >
            <Send size={16} />
            <span>{submitting ? 'Posting…' : 'Post'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
