import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';

export default function Root() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}
