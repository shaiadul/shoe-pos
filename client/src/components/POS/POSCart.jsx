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
  HiOutlineArchiveBox
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
    <div className="w-80 xl:w-96 flex flex-col bg-white dark:bg-surface-950 border-l border-surface-200/80 dark:border-surface-800 shrink-0 h-full select-none">
      {/* 1. Cart Header */}
      <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-900/40">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-surface-900 dark:text-white text-sm">
            Current Cart
          </span>
          {totalItemCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-black tracking-wider shadow-sm shadow-brand-500/30">
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
                className="px-2 py-1 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 transition-colors flex items-center gap-1"
                title="Hold this cart to serve another customer"
              >
                <HiOutlinePause className="text-xs" />
                <span>Hold</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="p-1 rounded-lg text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                title="Clear entire cart"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Customer Attachment Pill */}
      <div className="p-2.5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/20">
        <button
          type="button"
          onClick={onOpenCustomerModal}
          className={`w-full p-2 rounded-xl text-left transition-all border flex items-center justify-between ${
            customer
              ? 'bg-brand-50/60 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300'
              : 'bg-white dark:bg-surface-900 border-dashed border-surface-300 dark:border-surface-700 text-surface-500 hover:border-brand-400 hover:text-brand-600'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`p-1.5 rounded-lg text-xs ${
                customer
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
              }`}
            >
              {customer ? <HiOutlineUser /> : <HiOutlineUserPlus />}
            </span>
            <div className="truncate">
              <p className="text-xs font-bold truncate">
                {customer ? customer.name : 'Attach Customer (Walk-in)'}
              </p>
              {customer && customer.phone && (
                <p className="text-[10px] text-surface-400 font-mono truncate">{customer.phone}</p>
              )}
            </div>
          </div>

          {customer && (
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">
                {customer.loyaltyPoints || 0} pts
              </span>
              {customer.dueBalance > 0 && (
                <span className="text-[9px] font-bold text-rose-500 block">
                  Due {fmt(customer.dueBalance)}
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Clear Confirmation Prompt */}
      {showClearConfirm && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
          <span>Clear all items from cart?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-2 py-0.5 rounded text-surface-500 hover:text-surface-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onClearCart();
                setShowClearConfirm(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
            >
              Yes, Clear
            </button>
          </div>
        </div>
      )}

      {/* 3. Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {cart.map((item) => {
            const lineTotal = item.price * item.quantity * (1 - (item.discount || 0) / 100);
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="p-2.5 rounded-2xl bg-surface-50/70 dark:bg-surface-900/80 border border-surface-150 dark:border-surface-800/80 shadow-sm flex gap-2.5"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 overflow-hidden flex items-center justify-center shrink-0">
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
                    <p className="text-xs font-bold text-surface-900 dark:text-surface-100 truncate">
                      {item.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.key)}
                      className="text-surface-400 hover:text-rose-500 p-0.5 rounded transition-colors text-sm"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>

                  <p className="text-[10px] text-surface-400 mt-0.5 truncate">
                    <span className="font-semibold text-surface-600 dark:text-surface-300">
                      Size {item.size}
                    </span>
                    {item.color ? ` · ${item.color}` : ''}
                    {item.sku ? ` · ${item.sku}` : ''}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-surface-100 dark:border-surface-800/60">
                    {/* Stepper with comfortable size */}
                    <div className="flex items-center gap-1 bg-white dark:bg-surface-800 rounded-lg p-0.5 border border-surface-200 dark:border-surface-700 shadow-sm">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.key, -1)}
                        className="w-6 h-6 rounded-md bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold flex items-center justify-center active:scale-95 transition-all text-xs"
                      >
                        <HiOutlineMinus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-black text-surface-900 dark:text-white w-6 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.key, 1)}
                        className="w-6 h-6 rounded-md bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold flex items-center justify-center active:scale-95 transition-all text-xs"
                      >
                        <HiOutlinePlus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price and Line Total */}
                    <div className="text-right">
                      <p className="text-xs font-black text-brand-600 dark:text-brand-400 tabular-nums">
                        {fmt(lineTotal)}
                      </p>
                      {item.discount > 0 && (
                        <p className="text-[9px] text-surface-400 line-through tabular-nums">
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
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800/80 flex items-center justify-center text-surface-300 dark:text-surface-600 mb-3 shadow-inner">
              <HiOutlineShoppingBag className="text-3xl" />
            </div>
            <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
              Cart is currently empty
            </p>
            <p className="text-[11px] text-surface-400 mt-1 max-w-[180px]">
              Click on any shoe or scan a barcode to add to this order.
            </p>
          </div>
        )}
      </div>

      {/* 4. Cart Summary & Checkout */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-surface-200/80 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-900/60 backdrop-blur-sm space-y-3">
          {/* Quick Discount Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-surface-500 font-medium">
              <span className="flex items-center gap-1">
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
                  className="w-14 text-right px-2 py-1 text-xs font-bold font-mono rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                />
                <button
                  type="button"
                  onClick={() =>
                    setOrderDiscountType((t) => (t === 'percent' ? 'fixed' : 'percent'))
                  }
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-mono"
                  title="Toggle % or Flat amount"
                >
                  {orderDiscountType === 'percent' ? '%' : 'Tk'}
                </button>
              </div>
            </div>

            {/* Quick % chips */}
            <div className="flex gap-1 justify-end">
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyQuickDiscount(pct)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                    orderDiscountType === 'percent' && orderDiscount === pct
                      ? 'bg-brand-500 text-white shadow-sm'
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
          <div className="space-y-1 pt-2 border-t border-surface-200/60 dark:border-surface-800 text-xs">
            <div className="flex justify-between text-surface-500">
              <span>Subtotal</span>
              <span className="font-mono font-semibold tabular-nums">{fmt(subtotal)}</span>
            </div>

            {discountAmt > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discount Applied</span>
                <span className="font-mono tabular-nums">-{fmt(discountAmt)}</span>
              </div>
            )}

            {taxRate > 0 && (
              <div className="flex justify-between text-surface-500">
                <span>
                  {taxName} ({taxRate}%)
                </span>
                <span className="font-mono font-semibold tabular-nums">+{fmt(taxAmt)}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between text-surface-900 dark:text-white pt-2 border-t border-surface-200 dark:border-surface-700">
              <div>
                <span className="text-sm font-black">Net Total</span>
                <p className="text-[10px] text-surface-400">Tax included</p>
              </div>
              <span className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono tracking-tight tabular-nums">
                {fmt(total)}
              </span>
            </div>
          </div>

          {/* Big Checkout Trigger Button */}
          <button
            type="button"
            onClick={onOpenCheckout}
            className="btn-primary w-full justify-center py-3.5 text-base font-extrabold shadow-lg shadow-brand-500/25 active:scale-95 transition-all rounded-2xl"
          >
            <span>Proceed to Payment</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/20 text-xs font-mono">
              F9
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
