const FILTERS = ['all', 'pending', 'completed'];

export default function FilterBar({ activeFilter, onFilterChange }) {
  return (
    <div className="filters" role="group" aria-label="Filter habits">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          className={`filter-btn${activeFilter === filter ? ' active' : ''}`}
          onClick={() => onFilterChange(filter)}
          aria-pressed={activeFilter === filter}
        >
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </button>
      ))}
    </div>
  );
}
