import { motion } from 'framer-motion';
import { HiOutlineArchiveBox, HiOutlinePlus } from 'react-icons/hi2';

export default function ProductCard({ product, onSelectProduct, fmt }) {
  const hasStock = product.totalStock > 0;
  const isLowStock = hasStock && product.totalStock <= 5;
  const discPrice = product.price * (1 - (product.discount || 0) / 100);

  // Check unique sizes available
  const availableVariants = product.variants?.filter((v) => v.stock > 0) || [];
  const uniqueSizes = [...new Set(availableVariants.map((v) => v.size))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => hasStock && onSelectProduct(product)}
      className={`pos-product-card group relative bg-white dark:bg-surface-900 border border-surface-200/60 dark:border-surface-800/80 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-500/50 flex flex-col justify-between select-none ${
        !hasStock ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* Discount Tag */}
      {product.discount > 0 && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md shadow-brand-500/30">
          -{product.discount}%
        </div>
      )}

      {/* Out of Stock Overlay */}
      {!hasStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-950/60 rounded-2xl z-10 backdrop-blur-[2px]">
          <span className="text-[10px] font-black text-white bg-rose-600 px-3 py-1 rounded-full shadow-lg tracking-wider">
            OUT OF STOCK
          </span>
        </div>
      )}

      <div>
        {/* Product Image */}
        <div className="aspect-[4/3] bg-surface-50 dark:bg-surface-800/60 rounded-xl mb-2.5 flex items-center justify-center overflow-hidden border border-surface-100 dark:border-surface-800/80 group-hover:border-brand-200 dark:group-hover:border-brand-900 transition-colors relative">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain p-1.5 group-hover:scale-108 transition-transform duration-500 ease-out"
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x300?text=No+Photo';
              }}
            />
          ) : (
            <HiOutlineArchiveBox className="text-3xl text-surface-300 dark:text-surface-600" />
          )}

          {/* Quick-add badge on hover for desktop */}
          {hasStock && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="w-7 h-7 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/40 text-sm font-bold">
                <HiOutlinePlus className="w-4 h-4" />
              </span>
            </div>
          )}
        </div>

        {/* Brand & Name */}
        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider truncate mb-0.5">
          {product.brand || 'Shoe'}
        </p>
        <h3
          className="text-xs font-bold text-surface-900 dark:text-surface-100 leading-snug line-clamp-2 min-h-[2rem]"
          title={product.name}
        >
          {product.name}
        </h3>
      </div>

      {/* Footer: Price, Sizes count, and Stock Badge */}
      <div className="mt-2.5 pt-2 border-t border-surface-100 dark:border-surface-800/80 flex items-end justify-between gap-1">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-brand-600 dark:text-brand-400 tracking-tight">
              {fmt(discPrice)}
            </span>
            {product.discount > 0 && (
              <span className="text-[10px] text-surface-400 line-through font-medium">
                {fmt(product.price)}
              </span>
            )}
          </div>
          <p className="text-[10px] text-surface-400 font-medium">
            {uniqueSizes.length > 1
              ? `${uniqueSizes.length} sizes`
              : uniqueSizes[0]
              ? `Size ${uniqueSizes[0]}`
              : 'In stock'}
          </p>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
            !hasStock
              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              : isLowStock
              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {hasStock ? `${product.totalStock} left` : '0'}
        </span>
      </div>
    </motion.div>
  );
}
