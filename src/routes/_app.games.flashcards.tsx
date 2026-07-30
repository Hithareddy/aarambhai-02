import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FlashCardGame } from '@/components/games/FlashCardGame';

export const Route = createFileRoute('/_app/games/flashcards')({
  head: () => ({ meta: [{ title: 'Flash Cards Game — Aarambh AI' }] }),
  component: FlashCardsRoutePage,
});

function FlashCardsRoutePage() {
  const navigate = useNavigate();
  return <FlashCardGame onExit={() => navigate({ to: '/games' })} />;
}
