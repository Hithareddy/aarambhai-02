import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DailyChallengeGame } from '@/components/games/DailyChallengeGame';

export const Route = createFileRoute('/_app/games/daily-challenge')({
  head: () => ({ meta: [{ title: 'Daily Challenge — Aarambh AI' }] }),
  component: DailyChallengeRoute,
});

function DailyChallengeRoute() {
  const navigate = useNavigate();
  return <DailyChallengeGame onExit={() => navigate({ to: '/games' })} />;
}
