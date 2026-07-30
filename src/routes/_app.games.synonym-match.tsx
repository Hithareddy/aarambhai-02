import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SynonymMatchGame } from '@/components/games/SynonymMatchGame';

export const Route = createFileRoute('/_app/games/synonym-match')({
  head: () => ({ meta: [{ title: 'Synonym Match — Aarambh AI' }] }),
  component: SynonymMatchRoute,
});

function SynonymMatchRoute() {
  const navigate = useNavigate();
  return <SynonymMatchGame onExit={() => navigate({ to: '/games' })} />;
}
