import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FourPicsOneWordGame } from '@/components/games/FourPicsOneWordGame';

export const Route = createFileRoute('/_app/games/four-pics-one-word')({
  head: () => ({ meta: [{ title: '4 Pics 1 Word — Aarambh AI' }] }),
  component: FourPicsOneWordRoute,
});

function FourPicsOneWordRoute() {
  const navigate = useNavigate();
  return <FourPicsOneWordGame onExit={() => navigate({ to: '/games' })} />;
}
