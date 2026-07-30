import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { OppositeMatchGame } from '@/components/games/OppositeMatchGame';

export const Route = createFileRoute('/_app/games/opposite-match')({
  head: () => ({ meta: [{ title: 'Opposite Match — Aarambh AI' }] }),
  component: OppositeMatchRoute,
});

function OppositeMatchRoute() {
  const navigate = useNavigate();
  return <OppositeMatchGame onExit={() => navigate({ to: '/games' })} />;
}
