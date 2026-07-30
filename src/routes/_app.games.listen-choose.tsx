import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ListenChooseGame } from '@/components/games/ListenChooseGame';

export const Route = createFileRoute('/_app/games/listen-choose')({
  head: () => ({ meta: [{ title: 'Listen and Choose — Aarambh AI' }] }),
  component: ListenChooseRoute,
});

function ListenChooseRoute() {
  const navigate = useNavigate();
  return <ListenChooseGame onExit={() => navigate({ to: '/games' })} />;
}
