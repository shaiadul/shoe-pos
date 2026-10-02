import { useState } from 'react';
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineQrCode, 
  HiOutlineBookmark, 
  HiOutlineXMark,
  HiOutlineSquares2X2,
  HiOutlineFunnel,
  HiOutlineQuestionMarkCircle,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsPointingIn
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
  inStockOnly,
  setInStockOnly,
  brandList = [],
  selectedBrand = '',
  setSelectedBrand,
}) {
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="p-3 sm:p-3.5 border-b border-surface-200/80 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md sticky top-0 z-20 space-y-2.5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
      {/* Top Search & Actions Row */}
      <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
        {/* Product Search */}
        <div className="flex-1 min-w-[220px] relative group">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shoes by name, brand, SKU… (F2)"
            className="input pl-9 pr-14 py-2 text-xs sm:text-sm font-medium bg-surface-50/70 dark:bg-surface-800/60 focus:bg-white dark:focus:bg-surface-800 transition-all rounded-xl border-surface-200 dark:border-surface-700/80"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors text-sm">
            <HiOutlineMagnifyingGlass />
          </span>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 text-sm p-0.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700"
                title="Clear search"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 rounded border border-surface-200 dark:border-surface-700">
              F2
            </kbd>
          </div>
        </div>

        {/* Barcode Scanner Box */}
        <div className="relative w-48 sm:w-56 group">
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
            placeholder="Scan Barcode (F3 / Enter)"
            className="input pl-8 pr-16 text-xs sm:text-sm py-2 font-mono bg-brand-50/20 dark:bg-surface-800/70 border-brand-200/60 dark:border-surface-700/80 focus:border-brand-500 focus:bg-white dark:focus:bg-surface-800 rounded-xl"
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center">
            <HiOutlineQrCode className="text-brand-500 text-sm" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 scanner-active-pulse ml-0.5" title="Scanner Live" />
          </div>
          <button
            type="button"
            onClick={() => onBarcodeScan(barcodeInput)}
            disabled={!barcodeInput.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[9px] font-bold rounded-lg bg-surface-200 hover:bg-brand-500 hover:text-white dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-mono transition-colors disabled:opacity-40"
          >
            ↵ SCAN
          </button>
        </div>

        {/* In-Stock Only Quick Filter */}
        {setInStockOnly && (
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              inStockOnly
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-surface-100/70 dark:bg-surface-800/70 border-surface-200/60 dark:border-surface-700/60 text-surface-500 hover:text-surface-700'
            }`}
            title="Filter out products with 0 stock"
          >
            <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-emerald-500' : 'bg-surface-400'}`} />
            <span>In Stock Only</span>
          </button>
        )}

        {/* Brand Selector Dropdown if brands exist */}
        {brandList.length > 0 && setSelectedBrand && (
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2.5 py-2 rounded-xl text-xs font-bold bg-surface-100/80 dark:bg-surface-800/80 border border-surface-200/60 dark:border-surface-700/60 text-surface-700 dark:text-surface-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Brands</option>
              {brandList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Parked / Held Carts Action */}
        {heldCartsCount > 0 && (
          <button
            type="button"
            onClick={onOpenHeldCarts}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/40 text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <HiOutlineBookmark className="text-sm" />
            <span>Parked Carts</span>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {heldCartsCount}
            </span>
          </button>
        )}

        {/* Fullscreen & Shortcuts Help */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen POS Mode'}
          >
            {isFullscreen ? (
              <HiOutlineArrowsPointingIn className="w-4 h-4" />
            ) : (
              <HiOutlineArrowsPointingOut className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors relative"
            title="Keyboard Shortcuts"
          >
            <HiOutlineQuestionMarkCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Categories chips bar with sleek styling */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
            !selectedCategory
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.02]'
              : 'bg-surface-100/90 dark:bg-surface-800/90 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300'
          }`}
        >
          <HiOutlineSquares2X2 className="w-3.5 h-3.5" />
          <span>All Items</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? '' : cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.02]'
                  : 'bg-surface-100/90 dark:bg-surface-800/90 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Shortcuts Guide Dropdown / Modal */}
      {showShortcutsHelp && (
        <div className="p-3.5 rounded-2xl bg-surface-900 text-white shadow-2xl border border-surface-700 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-800">
            <span className="text-surface-300">Search Products</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-700 font-mono text-[10px] text-brand-400 font-bold">F2</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-800">
            <span className="text-surface-300">Scan Barcode</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-700 font-mono text-[10px] text-brand-400 font-bold">F3</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-800">
            <span className="text-surface-300">Attach Customer</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-700 font-mono text-[10px] text-brand-400 font-bold">F8</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-800">
            <span className="text-surface-300">Complete Checkout</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-700 font-mono text-[10px] text-brand-400 font-bold">F9</kbd>
          </div>
        </div>
      )}
    </div>
  );
}
