import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CategorySortGame } from '@/components/games/CategorySortGame';

export const Route = createFileRoute('/_app/games/category-sort')({
  head: () => ({ meta: [{ title: 'Category Sort — Aarambh AI' }] }),
  component: CategorySortRoute,
});

function CategorySortRoute() {
  const navigate = useNavigate();
  return <CategorySortGame onExit={() => navigate({ to: '/games' })} />;
}
