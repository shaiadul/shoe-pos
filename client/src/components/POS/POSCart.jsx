import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineShoppingBag, 
  HiOutlineTrash, 
  HiOutlineUser, 
  HiOutlineUserPlus, 
  HiOutlinePlus, 
  HiOutlineMinus, 
  HiOutlinePause, 
  HiOutlineTag,
  HiOutlineExclamationCircle,
  HiOutlineArchiveBox,
  HiOutlineArrowRight,
  HiOutlineGift,
  HiOutlineExclamationTriangle,
  HiOutlineXMark
} from 'react-icons/hi2';

export default function POSCart({
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onHoldCart,
  customer,
  onOpenCustomerModal,
  orderDiscount,
  setOrderDiscount,
  orderDiscountType,
  setOrderDiscountType,
  subtotal,
  discountAmt,
  taxAmt,
  total,
  taxRate,
  taxName,
  fmt,
  onOpenCheckout,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const totalItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const applyQuickDiscount = (pct) => {
    setOrderDiscountType('percent');
    setOrderDiscount(orderDiscount === pct ? 0 : pct);
  };

  return (
    <div className="w-80 xl:w-[380px] flex flex-col bg-white dark:bg-surface-950 border-l border-surface-200/80 dark:border-surface-800 shrink-0 h-full select-none shadow-[-4px_0_20px_-10px_rgba(0,0,0,0.06)]">
      {/* 1. Cart Header */}
      <div className="px-4 py-3 border-b border-surface-150 dark:border-surface-800 flex items-center justify-between bg-surface-50/70 dark:bg-surface-900/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <HiOutlineShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-surface-900 dark:text-white text-sm">
              Current Sale
            </span>
          </div>
          {totalItemCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-black tracking-wider shadow-xs shadow-brand-500/30">
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {cart.length > 0 && (
            <>
              <button
                type="button"
                onClick={onHoldCart}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-colors flex items-center gap-1"
                title="Hold this cart to serve another customer"
              >
                <HiOutlinePause className="text-xs" />
                <span>Hold</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                title="Clear entire cart"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Customer Attachment Card */}
      <div className="p-3 border-b border-surface-150 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/20">
        <button
          type="button"
          onClick={onOpenCustomerModal}
          className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-center justify-between group ${
            customer
              ? 'bg-brand-50/60 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800/80 text-surface-900 dark:text-white'
              : 'bg-white dark:bg-surface-900/90 border-dashed border-surface-300 dark:border-surface-700 text-surface-500 hover:border-brand-400 hover:text-brand-600'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                customer
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-400 group-hover:text-brand-500'
              }`}
            >
              {customer ? customer.name.charAt(0).toUpperCase() : <HiOutlineUserPlus />}
            </span>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold truncate">
                  {customer ? customer.name : 'Walk-in Customer'}
                </p>
                {!customer && (
                  <span className="px-1.5 py-0.2 rounded bg-surface-200 dark:bg-surface-800 text-[9px] font-mono text-surface-500">
                    F8
                  </span>
                )}
              </div>
              <p className="text-[10px] text-surface-400 font-mono truncate">
                {customer ? (customer.phone || 'Attached Member') : 'Click to attach & earn loyalty'}
              </p>
            </div>
          </div>

          {customer && (
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                <HiOutlineGift className="w-3 h-3" />
                <span>{customer.loyaltyPoints || 0} pts</span>
              </span>
              {customer.dueBalance > 0 && (
                <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5 justify-end mt-0.5 font-mono">
                  <HiOutlineExclamationTriangle className="w-3 h-3" />
                  Due: {fmt(customer.dueBalance)}
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Clear Confirmation Prompt */}
      {showClearConfirm && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
          <span className="font-semibold">Clear all items in cart?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-2 py-1 rounded text-surface-500 hover:text-surface-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onClearCart();
                setShowClearConfirm(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
            >
              Yes, Clear
            </button>
          </div>
        </div>
      )}

      {/* 3. Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pos-scroll">
        <AnimatePresence>
          {cart.map((item) => {
            const lineTotal = item.price * item.quantity * (1 - (item.discount || 0) / 100);
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="p-2.5 rounded-2xl bg-surface-50/80 dark:bg-surface-900/70 border border-surface-200/70 dark:border-surface-800 shadow-xs flex gap-2.5 group hover:border-brand-300 dark:hover:border-surface-700 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-13 h-13 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 overflow-hidden flex items-center justify-center shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100?text=Shoe';
                      }}
                    />
                  ) : (
                    <HiOutlineArchiveBox className="text-xl text-surface-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-bold text-surface-900 dark:text-surface-100 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.key)}
                      className="text-surface-400 hover:text-rose-500 p-0.5 rounded transition-colors text-sm"
                      title="Remove item"
                    >
                      <HiOutlineXMark className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Badges: Size, Color, SKU */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-surface-200/70 dark:bg-surface-800 text-[9px] font-black text-surface-700 dark:text-surface-300 uppercase">
                      Size {item.size}
                    </span>
                    {item.color && (
                      <span className="px-1.5 py-0.5 rounded bg-surface-200/70 dark:bg-surface-800 text-[9px] font-bold text-surface-600 dark:text-surface-300 capitalize">
                        {item.color}
                      </span>
                    )}
                    {item.sku && (
                      <span className="text-[9px] text-surface-400 font-mono">
                        {item.sku}
                      </span>
                    )}
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-surface-150 dark:border-surface-800/80">
                    {/* Stepper with comfortable size */}
                    <div className="flex items-center gap-1 bg-white dark:bg-surface-800 rounded-lg p-0.5 border border-surface-200 dark:border-surface-700 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.key, -1)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center active:scale-95 transition-all text-xs ${
                          item.quantity === 1
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-bold'
                        }`}
                        title={item.quantity === 1 ? 'Remove from cart' : 'Decrease'}
                      >
                        {item.quantity === 1 ? (
                          <HiOutlineTrash className="w-3 h-3 text-rose-500" />
                        ) : (
                          <HiOutlineMinus className="w-3 h-3" />
                        )}
                      </button>

                      <span className="text-xs font-mono font-black text-surface-900 dark:text-white w-7 text-center tabular-nums">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.key, 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-6 h-6 rounded-md bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold flex items-center justify-center active:scale-95 transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                        title={item.quantity >= item.stock ? 'Max available stock reached' : 'Increase'}
                      >
                        <HiOutlinePlus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price and Line Total */}
                    <div className="text-right">
                      <p className="text-xs font-black text-brand-600 dark:text-brand-400 tabular-nums font-mono">
                        {fmt(lineTotal)}
                      </p>
                      {item.discount > 0 && (
                        <p className="text-[9px] text-surface-400 line-through tabular-nums font-mono">
                          {fmt(item.price * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-surface-400">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-850 flex items-center justify-center text-surface-300 dark:text-surface-600 mb-3 shadow-inner">
              <HiOutlineShoppingBag className="text-3xl" />
            </div>
            <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
              Cart is currently empty
            </p>
            <p className="text-[11px] text-surface-400 mt-1 max-w-[200px]">
              Tap on any shoe card or scan a barcode to add footwear to this sale.
            </p>
          </div>
        )}
      </div>

      {/* 4. Cart Summary & Checkout */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-surface-200/80 dark:border-surface-800 bg-surface-50/80 dark:bg-surface-900/70 backdrop-blur-md space-y-3">
          {/* Order Discount Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-surface-500 font-medium">
              <span className="flex items-center gap-1 font-bold text-surface-600 dark:text-surface-400">
                <HiOutlineTag className="w-3.5 h-3.5 text-brand-500" />
                <span>Order Discount</span>
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max={orderDiscountType === 'percent' ? '100' : subtotal}
                  value={orderDiscount || ''}
                  onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-16 text-right px-2 py-1 text-xs font-bold font-mono rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setOrderDiscountType((t) => (t === 'percent' ? 'fixed' : 'percent'))
                  }
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-mono hover:bg-surface-300 transition-colors"
                  title="Toggle % or Flat amount"
                >
                  {orderDiscountType === 'percent' ? '%' : 'Tk'}
                </button>
              </div>
            </div>

            {/* Quick % discount chips */}
            <div className="flex gap-1 justify-end">
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyQuickDiscount(pct)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                    orderDiscountType === 'percent' && orderDiscount === pct
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'bg-white dark:bg-surface-800 text-surface-500 border border-surface-200 dark:border-surface-700 hover:border-brand-400'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              {orderDiscount > 0 && (
                <button
                  type="button"
                  onClick={() => setOrderDiscount(0)}
                  className="px-1.5 py-0.5 text-[10px] text-rose-500 hover:underline font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Breakdown Numbers */}
          <div className="space-y-1.5 pt-2 border-t border-surface-200/70 dark:border-surface-800 text-xs">
            <div className="flex justify-between text-surface-500">
              <span>Subtotal</span>
              <span className="font-mono font-bold tabular-nums">{fmt(subtotal)}</span>
            </div>

            {discountAmt > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Discount Applied</span>
                <span className="font-mono tabular-nums">-{fmt(discountAmt)}</span>
              </div>
            )}

            {taxRate > 0 && (
              <div className="flex justify-between text-surface-500">
                <span>
                  {taxName} ({taxRate}%)
                </span>
                <span className="font-mono font-bold tabular-nums">+{fmt(taxAmt)}</span>
              </div>
            )}

            {/* Net Total */}
            <div className="flex items-baseline justify-between text-surface-900 dark:text-white pt-2.5 border-t border-surface-200 dark:border-surface-700">
              <div>
                <span className="text-sm font-black uppercase tracking-tight">Net Total</span>
                <p className="text-[10px] text-surface-400 font-medium">All taxes included</p>
              </div>
              <span className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono tracking-tight tabular-nums">
                {fmt(total)}
              </span>
            </div>
          </div>

          {/* Big Checkout Trigger Button */}
          <button
            type="button"
            onClick={onOpenCheckout}
            className="btn-primary w-full justify-between py-3.5 px-4 text-sm font-black shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all rounded-2xl group"
          >
            <div className="flex items-center gap-2">
              <span>Proceed to Payment</span>
              <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-base">{fmt(total)}</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono">
                F9
              </kbd>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
