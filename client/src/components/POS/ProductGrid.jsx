import ProductCard from './ProductCard';
import { SkeletonGrid, Spinner } from '../UI';
import { HiOutlineArchiveBox, HiOutlineArrowPath } from 'react-icons/hi2';

export default function ProductGrid({
  products,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  onSelectProduct,
  fmt,
  search,
  onResetFilters,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
      {loading ? (
        <SkeletonGrid count={15} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onSelectProduct={onSelectProduct}
                fmt={fmt}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="btn-secondary py-2 px-6 text-xs font-bold rounded-xl shadow-sm hover:shadow"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span>Loading shoes…</span>
                  </span>
                ) : (
                  <span>Load more products</span>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 mb-3 shadow-inner">
            <HiOutlineArchiveBox className="text-3xl" />
          </div>
          <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100">
            No matching shoes found
          </h4>
          <p className="text-xs text-surface-400 max-w-xs mt-1">
            {search
              ? `We couldn't find any products matching "${search}".`
              : 'There are no products in this category.'}
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 flex items-center gap-1.5 transition-colors"
          >
            <HiOutlineArrowPath className="w-3.5 h-3.5" />
            Clear filters & search
          </button>
        </div>
      )}
    </div>
  );
}
