import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlineSparkles } from 'react-icons/hi2';

// Helper to get CSS color for common shoe colorways
function getColorHex(colorName = '') {
  const c = colorName.toLowerCase().trim();
  const map = {
    black: '#18181b',
    white: '#ffffff',
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
    gold: '#eab308',
    silver: '#cbd5e1',
    beige: '#f5f5dc',
    cream: '#fffdd0',
  };
  return map[c] || '#94a3b8';
}

// Fallback Sneaker SVG Graphic when image is missing or broken
function SneakerFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-100 dark:bg-surface-800 text-surface-400 p-4">
      <svg
        className="w-14 h-14 stroke-current fill-none stroke-[1.5]"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 15.5c1.5-2 4-3 6.5-3s5 2 7 2 3-1.5 3.5-3l.5-4c0-.5-.5-1-1-1h-2l-2-2.5h-4l-2 3.5H5c-1 0-1.8.8-1.8 1.8l.3 6.2z" />
        <path d="M2.5 18.5h19c.6 0 1-.4 1-1v-1c0-.6-.4-1-1-1H2.5c-.6 0-1 .4-1 1v1c0 .6.4 1 1 1z" />
        <path d="M8 12.5v-2" />
        <path d="M11 12.5v-2" />
        <path d="M14 13.5v-2" />
      </svg>
      <span className="text-[10px] font-bold mt-1 tracking-wider uppercase opacity-60">Shoe</span>
    </div>
  );
}

export default function ProductCard({ product, onSelectProduct, fmt }) {
  const [imgError, setImgError] = useState(false);
  const hasStock = product.totalStock > 0;
  const isLowStock = hasStock && product.totalStock <= 5;
  const discPrice = product.price * (1 - (product.discount || 0) / 100);

  // Extract unique available sizes and colors
  const availableVariants = product.variants?.filter((v) => v.stock > 0) || [];
  const uniqueSizes = [...new Set(availableVariants.map((v) => v.size))].sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return !isNaN(numA) && !isNaN(numB) ? numA - numB : String(a).localeCompare(String(b));
  });
  const uniqueColors = [...new Set(availableVariants.map((v) => v.color).filter(Boolean))];

  const imageUrl = product.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      onClick={() => hasStock && onSelectProduct(product)}
      className={`group relative bg-white dark:bg-surface-900 border border-surface-200/90 dark:border-surface-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-400 dark:hover:border-brand-500/70 transition-all duration-200 flex flex-col justify-between select-none ${
        !hasStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.985]'
      }`}
    >
      {/* 1. Image Stage & Overlay Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-100 dark:bg-surface-800/80">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-300 ease-out"
          />
        ) : (
          <SneakerFallback />
        )}

        {/* Subtle gradient vignette at bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

        {/* Brand Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xs">
            {product.brand || 'Shoe'}
          </span>
        </div>

        {/* Discount Tag (Top Left) */}
        {product.discount > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-rose-500 to-brand-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md shadow-rose-500/30 tracking-wider">
            -{product.discount}%
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!hasStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px] z-10">
            <span className="text-[10px] font-black text-white bg-rose-600 px-3 py-1 rounded-full shadow-lg tracking-wider border border-white/20">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Floating Quick Action Indicator on hover */}
        {hasStock && (
          <div className="absolute bottom-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
            <span className="px-2.5 py-1 rounded-xl bg-brand-500 text-white text-xs font-black shadow-lg shadow-brand-500/40 flex items-center gap-1 active:scale-95">
              <HiOutlinePlus className="w-3.5 h-3.5" />
              <span>Select</span>
            </span>
          </div>
        )}

        {/* Color swatches preview on image bottom left */}
        {uniqueColors.length > 0 && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/10">
            {uniqueColors.slice(0, 3).map((clr) => (
              <span
                key={clr}
                className="w-2.5 h-2.5 rounded-full border border-white/60 shadow-xs shrink-0"
                style={{ backgroundColor: getColorHex(clr) }}
                title={clr}
              />
            ))}
            {uniqueColors.length > 3 && (
              <span className="text-[8px] text-white/90 font-bold">
                +{uniqueColors.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Card Content & Details */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Title */}
          <div className="flex items-center justify-between text-[10px] text-surface-400 font-bold uppercase tracking-wider mb-1">
            <span>{product.category || 'Footwear'}</span>
            <span
              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                !hasStock
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : isLowStock
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {hasStock ? `${product.totalStock} in stock` : 'Sold out'}
            </span>
          </div>

          <h3
            className="text-xs font-bold text-surface-900 dark:text-surface-100 leading-snug line-clamp-2 min-h-[2.1rem] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Available Sizes preview pills */}
          <div className="mt-2 flex items-center gap-1 flex-wrap min-h-[1.4rem]">
            {uniqueSizes.length > 0 ? (
              uniqueSizes.slice(0, 4).map((sz) => (
                <span
                  key={sz}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200/70 dark:border-surface-700/70"
                >
                  {sz}
                </span>
              ))
            ) : (
              <span className="text-[9px] text-surface-400">Single Variant</span>
            )}
            {uniqueSizes.length > 4 && (
              <span className="text-[9px] text-surface-400 font-bold">
                +{uniqueSizes.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* 3. Card Footer: Price */}
        <div className="mt-3 pt-2 border-t border-surface-150 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-brand-600 dark:text-brand-400 font-mono tracking-tight">
              {fmt(discPrice)}
            </span>
            {product.discount > 0 && (
              <span className="text-[10px] text-surface-400 line-through font-mono">
                {fmt(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            className="w-7 h-7 rounded-xl bg-surface-100 hover:bg-brand-500 hover:text-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center transition-all group-hover:bg-brand-500 group-hover:text-white shadow-2xs"
            title="Select variant"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
