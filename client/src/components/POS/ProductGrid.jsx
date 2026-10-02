import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { SkeletonGrid, Spinner } from '../UI';
import { 
  HiOutlineArchiveBox, 
  HiOutlineArrowPath, 
  HiOutlineArrowsUpDown,
  HiOutlineShoppingBag 
} from 'react-icons/hi2';

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
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price-asc' | 'price-desc' | 'stock-desc' | 'name-asc'

  // Local sorting
  const sortedProducts = useMemo(() => {
    if (!products || !products.length) return [];
    const list = [...products];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock-desc') {
      list.sort((a, b) => (b.totalStock || 0) - (a.totalStock || 0));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, sortBy]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-50/50 dark:bg-surface-950/40">
      {/* Products Bar: Counter & Quick Sort */}
      <div className="px-4 py-2 border-b border-surface-200/60 dark:border-surface-800/60 flex items-center justify-between text-xs text-surface-500">
        <div className="flex items-center gap-1.5 font-medium">
          <HiOutlineShoppingBag className="text-surface-400" />
          <span>
            Showing <strong className="text-surface-800 dark:text-surface-200">{products.length}</strong> shoes
            {search ? ` for "${search}"` : ''}
          </span>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5">
          <HiOutlineArrowsUpDown className="text-surface-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-surface-850 border border-surface-200 dark:border-surface-700/80 rounded-lg px-2 py-1 text-xs font-semibold text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="default">Default Sort</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock-desc">Stock: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 pos-scroll">
        {loading ? (
          <SkeletonGrid count={15} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
        ) : sortedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {sortedProducts.map((product) => (
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
              <div className="flex justify-center pt-3 pb-6">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="btn-secondary py-2 px-6 text-xs font-bold rounded-xl shadow-sm hover:shadow"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      <span>Loading more shoes…</span>
                    </span>
                  ) : (
                    <span>Load more products</span>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 mb-3 shadow-inner">
              <HiOutlineArchiveBox className="text-3xl" />
            </div>
            <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100">
              No matching shoes found
            </h4>
            <p className="text-xs text-surface-400 max-w-xs mt-1">
              {search
                ? `We couldn't find any footwear matching "${search}".`
                : 'There are no products in this category.'}
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <HiOutlineArrowPath className="w-3.5 h-3.5" />
              Reset search & filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
