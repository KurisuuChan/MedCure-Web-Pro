import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Professional Pagination Component
 * A modern, accessible pagination component with multiple display modes
 */
const ProfessionalPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelect = true,
  showItemCount = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  pageSizeOptions = [5, 10, 20, 50, 100],
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'minimal', 'rounded'
  className = '',
  disabled = false
}) => {
  // Calculate pagination info
  const startIndex = Math.max(1, (currentPage - 1) * itemsPerPage + 1);
  const endIndex = Math.min(totalItems, currentPage * itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Size configurations
  const sizeConfig = {
    small: {
      button: 'px-2 py-1 text-xs',
      select: 'text-xs px-2 py-1',
      text: 'text-xs',
      spacing: 'space-x-1'
    },
    medium: {
      button: 'px-3 py-2 text-sm',
      select: 'text-sm px-3 py-2',
      text: 'text-sm',
      spacing: 'space-x-2'
    },
    large: {
      button: 'px-4 py-3 text-base',
      select: 'text-base px-4 py-3',
      text: 'text-base',
      spacing: 'space-x-3'
    }
  };

  // Variant configurations
  const variantConfig = {
    default: {
      button: 'border border-gray-300 bg-white hover:bg-gray-50',
      activeButton: 'border-blue-500 bg-blue-600 text-white',
      container: 'bg-white border border-gray-200 rounded-lg'
    },
    minimal: {
      button: 'border-0 bg-transparent hover:bg-gray-100',
      activeButton: 'bg-blue-100 text-blue-700',
      container: 'bg-transparent'
    },
    rounded: {
      button: 'border-0 bg-gray-100 hover:bg-gray-200 rounded-full',
      activeButton: 'bg-blue-600 text-white rounded-full',
      container: 'bg-white rounded-xl shadow-sm border border-gray-200'
    }
  };

  const config = sizeConfig[size];
  const styles = variantConfig[variant];

  // Generate page numbers to show
  const generatePageNumbers = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add first page if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Handle page changes
  const handlePageChange = (page) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) return;
    onPageChange?.(page);
  };

  const handlePageSizeChange = (newSize) => {
    if (disabled) return;
    onPageSizeChange?.(newSize);
  };

  // Don't render if no pages
  if (totalPages <= 1 && !showItemCount && !showPageSizeSelect) {
    return null;
  }

  return (
    <div className={`
      flex flex-col sm:flex-row items-center justify-between 
      ${styles.container} 
      p-4 
      ${className}
    `}>
      {/* Left side - Item count and page size */}
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
        {showItemCount && totalItems > 0 && (
          <div className={`text-gray-700 ${config.text}`}>
            Showing <span className="font-medium">{startIndex}</span> to{' '}
            <span className="font-medium">{endIndex}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
        )}
        
        {showPageSizeSelect && pageSizeOptions.length > 1 && (
          <div className="flex items-center space-x-2">
            <label className={`text-gray-700 ${config.text}`}>
              Show:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className={`
                ${config.select} 
                border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 
                focus:border-blue-500 bg-white
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side - Page navigation */}
      {totalPages > 1 && (
        <div className={`flex items-center ${config.spacing}`}>
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevPage || disabled}
            className={`
              ${config.button} 
              ${styles.button}
              flex items-center rounded-md transition-colors duration-200
              ${(!hasPrevPage || disabled) 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-sm'
              }
            `}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </button>

          {/* Page numbers */}
          {showPageNumbers && (
            <div className={`flex items-center ${config.spacing}`}>
              {generatePageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className={`
                      ${config.button} 
                      flex items-center justify-center
                      text-gray-500 cursor-default
                    `}>
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page)}
                      disabled={disabled}
                      className={`
                        ${config.button}
                        ${page === currentPage 
                          ? styles.activeButton 
                          : styles.button
                        }
                        flex items-center justify-center rounded-md transition-colors duration-200
                        min-w-[40px] font-medium
                        ${disabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'cursor-pointer hover:shadow-sm'
                        }
                      `}
                      aria-label={`Page ${page}`}
                      aria-current={page === currentPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage || disabled}
            className={`
              ${config.button} 
              ${styles.button}
              flex items-center rounded-md transition-colors duration-200
              ${(!hasNextPage || disabled) 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-sm'
              }
            `}
            aria-label="Next page"
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Simplified pagination hook for easy state management
 */
export const usePagination = ({
  totalItems,
  itemsPerPage: initialItemsPerPage = 10,
  initialPage = 1
}) => {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Reset to first page when items per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Reset to last page if current page exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = (page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(current => current + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(current => current - 1);
    }
  };

  const changePageSize = (newSize) => {
    setItemsPerPage(newSize);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    setCurrentPage,
    setItemsPerPage
  };
};

/**
 * Card Grid with Pagination Component
 * Wrapper component that handles pagination for card grids
 */
export const PaginatedCardGrid = ({
  items = [],
  renderItem,
  itemsPerPage = 12,
  gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  gap = 'gap-6',
  emptyState,
  loading = false,
  loadingComponent,
  paginationProps = {},
  className = ''
}) => {
  const pagination = usePagination({
    totalItems: items.length,
    itemsPerPage
  });

  // Get current page items
  const currentItems = items.slice(pagination.startIndex, pagination.endIndex);

  if (loading) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return emptyState || (
      <div className="text-center p-12">
        <p className="text-gray-500">No items to display</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Card Grid */}
      <div className={`grid ${gridCols} ${gap} mb-6`}>
        {currentItems.map((item, index) => (
          <div key={item.id || index}>
            {renderItem(item, pagination.startIndex + index)}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <ProfessionalPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.goToPage}
        onPageSizeChange={pagination.changePageSize}
        {...paginationProps}
      />
    </div>
  );
};

export default ProfessionalPagination;