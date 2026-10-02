import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineArchiveBox, 
  HiOutlineXMark, 
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineSparkles 
} from 'react-icons/hi2';

function getColorHex(colorName = '') {
  const c = colorName.toLowerCase().trim();
  const map = {
    black: '#18181b',
    white: '#f4f4f5',
    red: '#ef4444',
    blue: '#3b82f6',
    navy: '#1e3a8a',
    grey: '#71717a',
    gray: '#71717a',
    green: '#10b981',
    brown: '#78350f',
    tan: '#d97706',
    yellow: '#eab308',
    pink: '#ec4899',
    purple: '#a855f7',
    orange: '#f97316',
    olive: '#65a30d',
    maroon: '#881337',
  };
  return map[c] || '#94a3b8';
}

export default function VariantSelectorModal({ modalData, onClose, onAddToCart, fmt }) {
  if (!modalData) return null;
  const { product, sizes } = modalData;
  const discPrice = product.price * (1 - (product.discount || 0) / 100);

  // Sorted size keys
  const sortedSizes = useMemo(() => {
    return Object.keys(sizes).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      return !isNaN(numA) && !isNaN(numB) ? numA - numB : String(a).localeCompare(String(b));
    });
  }, [sizes]);

  // Default active size to first one that has stock
  const [activeSize, setActiveSize] = useState(() => {
    const firstInStock = sortedSizes.find((sz) => sizes[sz]?.some((v) => v.stock > 0));
    return firstInStock || sortedSizes[0] || '';
  });

  useEffect(() => {
    const firstInStock = sortedSizes.find((sz) => sizes[sz]?.some((v) => v.stock > 0));
    setActiveSize(firstInStock || sortedSizes[0] || '');
  }, [sortedSizes, sizes]);

  const activeVariants = sizes[activeSize] || [];

  const modalJSX = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-surface-150 dark:border-surface-800 flex items-center justify-between bg-surface-50/70 dark:bg-surface-850/60">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <HiOutlineArchiveBox className="text-2xl text-surface-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider block">
                  {product.brand || 'Shoe'}
                </span>
                <h3 className="font-extrabold text-sm text-surface-900 dark:text-white truncate">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-brand-600 dark:text-brand-400 font-black text-sm font-mono">
                    {fmt(discPrice)}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-surface-400 line-through text-xs font-mono">
                      {fmt(product.price)}
                    </span>
                  )}
                  {product.discount > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-black">
                      -{product.discount}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Size Matrix & Color Selector Body */}
          <div className="p-5 overflow-y-auto space-y-4 pos-scroll flex-1">
            {/* 1. Size Tabs Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold text-surface-700 dark:text-surface-200 uppercase tracking-wider">
                  1. Select Shoe Size
                </label>
                <span className="text-[11px] text-surface-400">
                  {sortedSizes.length} sizes available
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {sortedSizes.map((sz) => {
                  const variants = sizes[sz] || [];
                  const sizeTotalStock = variants.reduce((s, v) => s + v.stock, 0);
                  const isSelected = activeSize === sz;
                  const isOutOfStock = sizeTotalStock === 0;

                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => !isOutOfStock && setActiveSize(sz)}
                      disabled={isOutOfStock}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/30 scale-102 font-bold'
                          : isOutOfStock
                          ? 'border-surface-200 dark:border-surface-800 bg-surface-100/50 dark:bg-surface-800/40 text-surface-400 opacity-40 cursor-not-allowed'
                          : 'border-surface-200 dark:border-surface-700/80 bg-white dark:bg-surface-800 hover:border-brand-400 text-surface-800 dark:text-surface-200'
                      }`}
                    >
                      <span className="text-xs font-black">
                        {sz}
                      </span>
                      <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-surface-400'}`}>
                        {isOutOfStock ? 'Sold' : `${sizeTotalStock} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Colorways & Variants for Selected Size */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold text-surface-700 dark:text-surface-200 uppercase tracking-wider">
                  2. Choose Colorway for Size {activeSize}
                </label>
                <span className="text-[11px] text-surface-400 font-mono">
                  {activeVariants.filter((v) => v.stock > 0).length} in stock
                </span>
              </div>

              <div className="space-y-2">
                {activeVariants.map((variant) => {
                  const isOutOfStock = variant.stock === 0;
                  const isLowStock = variant.stock > 0 && variant.stock <= 2;

                  return (
                    <div
                      key={`${variant.size}-${variant.color}-${variant.sku}`}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isOutOfStock
                          ? 'border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/30 opacity-60'
                          : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-400 hover:shadow-md'
                      }`}
                    >
                      {/* Color Preview & SKU */}
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-xl border border-black/10 dark:border-white/20 shadow-xs flex items-center justify-center shrink-0"
                          style={{ backgroundColor: getColorHex(variant.color) }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-surface-900 dark:text-white capitalize">
                              {variant.color || 'Standard'}
                            </h4>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-100 dark:bg-surface-700 text-surface-500">
                              {variant.sku || `SZ-${variant.size}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] font-bold ${
                                isOutOfStock
                                  ? 'text-rose-500'
                                  : isLowStock
                                  ? 'text-amber-500'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isOutOfStock
                                ? 'Out of stock'
                                : isLowStock
                                ? `Low stock (${variant.stock} pairs left)`
                                : `${variant.stock} pairs available`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => !isOutOfStock && onAddToCart(product, variant)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
                          isOutOfStock
                            ? 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                            : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/25 active:scale-95'
                        }`}
                      >
                        <HiOutlinePlus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-surface-150 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-850/60 flex justify-between items-center text-xs text-surface-400">
            <span>Press variant button to add to active sale</span>
            <kbd className="px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 font-mono text-[10px] font-bold">
              Esc to close
            </kbd>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
}
