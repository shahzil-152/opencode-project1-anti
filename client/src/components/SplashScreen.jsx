import { LogoMark } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Feedback';

/** Full-screen pause shown while the session is being restored. */
export default function SplashScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper">
      <div className="flex flex-col items-center gap-3">
        <LogoMark size={34} />
        <span className="text-[15px] font-semibold tracking-tight text-ink">TaskFlow</span>
      </div>
      <Spinner size={16} />
    </div>
  );
}
