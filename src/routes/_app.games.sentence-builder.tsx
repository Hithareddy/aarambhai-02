import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SentenceBuilderGame } from '@/components/games/SentenceBuilderGame';

export const Route = createFileRoute('/_app/games/sentence-builder')({
  head: () => ({ meta: [{ title: 'Sentence Builder — Aarambh AI' }] }),
  component: SentenceBuilderRoute,
});

function SentenceBuilderRoute() {
  const navigate = useNavigate();
  return <SentenceBuilderGame onExit={() => navigate({ to: '/games' })} />;
}
