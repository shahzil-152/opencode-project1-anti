import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 text-center">
      <p className="text-[64px] font-semibold leading-none tracking-tight text-clay">404</p>
      <h1 className="mt-3 text-[18px] font-semibold text-ink">Page not found</h1>
      <p className="mt-1 text-[13.5px] text-muted">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/app/dashboard" className="mt-6">
        <Button variant="primary">Back to overview</Button>
      </Link>
    </div>
  );
}
