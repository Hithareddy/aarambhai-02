import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PictureMatchGame } from '@/components/games/PictureMatchGame';

export const Route = createFileRoute('/_app/games/picture-match')({
  head: () => ({ meta: [{ title: 'Picture Match Game — Aarambh AI' }] }),
  component: PictureMatchRoutePage,
});

function PictureMatchRoutePage() {
  const navigate = useNavigate();
  return <PictureMatchGame onExit={() => navigate({ to: '/games' })} />;
}
