import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineArchiveBox, HiOutlineXMark, HiOutlineCheck } from 'react-icons/hi2';

export default function VariantSelectorModal({ modalData, onClose, onAddToCart, fmt }) {
  if (!modalData) return null;
  const { product, sizes } = modalData;
  const discPrice = product.price * (1 - (product.discount || 0) / 100);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-surface-200 dark:border-surface-800"
        >
          {/* Header */}
          <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 overflow-hidden flex items-center justify-center shrink-0">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <HiOutlineArchiveBox className="text-xl text-surface-400" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-surface-900 dark:text-white truncate">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-brand-600 dark:text-brand-400 font-extrabold">
                    {fmt(discPrice)}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-surface-400 line-through text-[11px]">
                      {fmt(product.price)}
                    </span>
                  )}
                  <span className="text-surface-300 dark:text-surface-600">·</span>
                  <span className="text-surface-400 text-[11px] font-medium uppercase">
                    {product.brand}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Size & Color options */}
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
            <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
              Choose Size & Color Variant:
            </p>

            {Object.entries(sizes).map(([size, variants]) => (
              <div
                key={size}
                className="p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-surface-900 dark:text-white flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-surface-200 dark:bg-surface-700 text-[11px]">
                      Size {size}
                    </span>
                  </span>
                  <span className="text-[10px] text-surface-400 font-medium">
                    {variants.reduce((acc, v) => acc + v.stock, 0)} available
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {variants.map((variant) => {
                    const isOutOfStock = variant.stock === 0;
                    return (
                      <button
                        key={`${variant.size}-${variant.color}-${variant.sku}`}
                        type="button"
                        onClick={() => !isOutOfStock && onAddToCart(product, variant)}
                        disabled={isOutOfStock}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isOutOfStock
                            ? 'border-surface-200 dark:border-surface-700 bg-surface-100/50 dark:bg-surface-800/40 text-surface-400 cursor-not-allowed opacity-50'
                            : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 active:scale-95 shadow-sm'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-surface-800 dark:text-surface-100 capitalize">
                            {variant.color || 'Standard'}
                          </p>
                          <p className="text-[10px] text-surface-400 font-mono mt-0.5">
                            {variant.sku || `SZ-${variant.size}`}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50'
                              : variant.stock <= 3
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? 'Out' : `${variant.stock} left`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 flex justify-between items-center text-xs text-surface-400">
            <span>Click any variant to add to cart</span>
            <kbd className="px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 font-mono text-[10px]">
              Esc to cancel
            </kbd>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
