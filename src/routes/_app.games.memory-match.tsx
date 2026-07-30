import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { MemoryMatchGame } from '@/components/games/MemoryMatchGame';

export const Route = createFileRoute('/_app/games/memory-match')({
  head: () => ({ meta: [{ title: 'Memory Match Game — Aarambh AI' }] }),
  component: MemoryMatchRoutePage,
});

function MemoryMatchRoutePage() {
  const navigate = useNavigate();
  return <MemoryMatchGame onExit={() => navigate({ to: '/games' })} />;
}
