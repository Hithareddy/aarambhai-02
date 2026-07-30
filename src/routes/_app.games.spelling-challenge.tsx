import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SpellingChallengeGame } from '@/components/games/SpellingChallengeGame';

export const Route = createFileRoute('/_app/games/spelling-challenge')({
  head: () => ({ meta: [{ title: 'Spelling Challenge — Aarambh AI' }] }),
  component: SpellingChallengeRoute,
});

function SpellingChallengeRoute() {
  const navigate = useNavigate();
  return <SpellingChallengeGame onExit={() => navigate({ to: '/games' })} />;
}
