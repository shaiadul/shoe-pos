import { useRef } from 'react';
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineQrCode, 
  HiOutlineBookmark, 
  HiOutlineXMark 
} from 'react-icons/hi2';

export default function POSHeader({
  search,
  setSearch,
  barcodeInput,
  setBarcodeInput,
  onBarcodeScan,
  categories,
  selectedCategory,
  setSelectedCategory,
  heldCartsCount,
  onOpenHeldCarts,
  searchRef,
  barcodeInputRef,
}) {
  return (
    <div className="p-3 border-b border-surface-200/80 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 backdrop-blur-md sticky top-0 z-20 space-y-2.5">
      <div className="flex gap-2 flex-wrap items-center">
        {/* Search input with shortcut badge and clear button */}
        <div className="flex-1 min-w-[200px] relative">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shoes, brand, SKU… (Press F2)"
            className="input pl-9 pr-14 py-2 text-xs font-medium"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
            <HiOutlineMagnifyingGlass />
          </span>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 text-sm p-0.5 rounded-full"
                title="Clear search"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-surface-400 bg-surface-100 dark:bg-surface-800 rounded border border-surface-200 dark:border-surface-700">
              F2
            </kbd>
          </div>
        </div>

        {/* Barcode scanner input */}
        <div className="relative w-44 sm:w-52">
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onBarcodeScan(barcodeInput);
              }
            }}
            placeholder="Scan Barcode (Enter)…"
            className="input pl-8 pr-12 text-xs py-2 font-mono bg-surface-50/50 dark:bg-surface-800/50 focus:bg-white dark:focus:bg-surface-800"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-500 text-sm">
            <HiOutlineQrCode />
          </span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-200/80 dark:bg-surface-700 text-surface-500 font-mono">
            ↵ SCAN
          </span>
        </div>

        {/* Held carts indicator button */}
        {heldCartsCount > 0 && (
          <button
            type="button"
            onClick={onOpenHeldCarts}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <HiOutlineBookmark className="text-sm" />
            <span>Held Carts</span>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {heldCartsCount}
            </span>
          </button>
        )}

        {/* Keyboard shortcut legend */}
        <div className="hidden 2xl:flex items-center gap-2 text-[10px] text-surface-400 font-mono bg-surface-100/70 dark:bg-surface-800/70 px-2.5 py-1.5 rounded-lg border border-surface-200/50 dark:border-surface-700/50">
          <span>F2: Search</span>
          <span>·</span>
          <span>F9: Checkout</span>
          <span>·</span>
          <span>Esc: Close</span>
        </div>
      </div>

      {/* Categories chips bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            !selectedCategory
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
              : 'bg-surface-100/90 dark:bg-surface-800/90 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? '' : cat)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                  : 'bg-surface-100/90 dark:bg-surface-800/90 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
