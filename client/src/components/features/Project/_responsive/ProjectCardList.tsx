import { ProjectCardRow } from '../_components/ProjectCardRow';

type Props = {
  projects: any[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  search: string;
};

export function ProjectCardList({ projects, favorites, onToggleFavorite, search }: Props) {
  const isEmpty = projects.length === 0;

  return (
    <div className="space-y-4">
      {isEmpty ? (
        <p className="py-50 text-center text-base text-gray-500">등록된 프로젝트가 없습니다.</p>
      ) : (
        projects.map((p) => (
          <ProjectCardRow
            key={p.project_id}
            item={p}
            isFavorite={favorites.includes(p.project_id)}
            onToggleFavorite={onToggleFavorite}
            search={search}
          />
        ))
      )}
    </div>
  );
}
