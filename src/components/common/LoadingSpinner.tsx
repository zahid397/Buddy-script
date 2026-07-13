export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex justify-center py-4">
      <div
        className="animate-spin rounded-full border-2 border-gray-200 border-t-brand"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
