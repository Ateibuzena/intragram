export const PostSkeleton = () => (
  <div className="bg-ft-card border border-ft-border rounded-2xl p-5 mb-3 animate-pulse">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-9 h-9 rounded-full bg-ft-faint" />
      <div className="flex-1">
        <div className="h-3 w-24 bg-ft-faint rounded-full mb-2" />
        <div className="h-2 w-16 bg-ft-faint rounded-full" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-2.5 bg-ft-faint rounded-full w-full" />
      <div className="h-2.5 bg-ft-faint rounded-full w-4/5" />
      <div className="h-2.5 bg-ft-faint rounded-full w-3/5" />
    </div>
    <div className="flex gap-3 pt-3 border-t border-ft-border">
      <div className="h-6 w-14 bg-ft-faint rounded-lg" />
      <div className="h-6 w-14 bg-ft-faint rounded-lg" />
      <div className="h-6 w-20 bg-ft-faint rounded-lg ml-auto" />
    </div>
  </div>
);
