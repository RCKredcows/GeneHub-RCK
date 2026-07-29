import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './styles.css';

// Generate page numbers with ellipsis for large page counts
const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  // Show all pages if 7 or fewer
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let start = Math.max(2, currentPage - 1);
  let end = Math.min(totalPages - 1, currentPage + 1);

  // Adjust range to always show 3 middle numbers when possible
  if (currentPage <= 3) {
    end = Math.min(4, totalPages - 1);
  } else if (currentPage >= totalPages - 2) {
    start = Math.max(2, totalPages - 3);
  }

  // Add ellipsis before middle section if needed
  if (start > 2) {
    pages.push('ellipsis-start');
  }

  // Add middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis after middle section if needed
  if (end < totalPages - 1) {
    pages.push('ellipsis-end');
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const handlePageChange = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pagination">
      <span className="pagination__info">
        {startIndex}–{endIndex} of {totalItems}
      </span>
      <div className="pagination__controls">
        <button
          className="pagination__btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} />
        </button>
        {pageNumbers.map((page) => {
          if (typeof page === 'string') {
            return (
              <span key={page} className="pagination__ellipsis">
                …
              </span>
            );
          }
          return (
            <button
              key={page}
              className={`pagination__btn ${page === currentPage ? 'pagination__btn--active' : ''}`}
              onClick={() => handlePageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
        <button
          className="pagination__btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
