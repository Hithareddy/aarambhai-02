import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { WordSearchGame } from '@/components/games/WordSearchGame';

export const Route = createFileRoute('/_app/games/word-search')({
  head: () => ({ meta: [{ title: 'Word Search — Aarambh AI' }] }),
  component: WordSearchRoute,
});

function WordSearchRoute() {
  const navigate = useNavigate();
  return <WordSearchGame onExit={() => navigate({ to: '/games' })} />;
}
