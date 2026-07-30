import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { WordMatchGame } from '@/components/games/WordMatchGame';

export const Route = createFileRoute('/_app/games/word-match')({
  head: () => ({ meta: [{ title: 'Word Match — Aarambh AI' }] }),
  component: WordMatchRoute,
});

function WordMatchRoute() {
  const navigate = useNavigate();
  return <WordMatchGame onExit={() => navigate({ to: '/games' })} />;
}
