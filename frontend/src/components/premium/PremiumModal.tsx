import { Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../Button';
import { cn } from '../../lib/cn';

export function PremiumModal({
  title = 'Upgrade required',
  description = 'This feature is available on Pro and Enterprise plans.',
  onClose,
}: {
  title?: string;
  description?: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section className={cn('w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl')}>
        <div className="relative px-6 py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.35),rgba(0,0,0,0))]" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-indigo-200">
              <Lock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <Crown className="h-4 w-4 text-indigo-300" />
                {title}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/70">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/5 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 bg-transparent px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Not now
          </button>
          <Button
            onClick={() => {
              onClose();
              navigate('/upgrade');
            }}
            className="h-11"
          >
            Upgrade to Pro
          </Button>
        </div>
      </section>
    </div>
  );
}

