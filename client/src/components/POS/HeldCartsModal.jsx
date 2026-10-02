import { motion } from 'framer-motion';
import { 
  HiOutlineBookmark, 
  HiOutlineTrash, 
  HiOutlineArrowUturnLeft, 
  HiOutlineXMark 
} from 'react-icons/hi2';

export default function HeldCartsModal({
  open,
  onClose,
  heldCarts,
  onRecallCart,
  onDeleteHeldCart,
  fmt,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-lg">
              <HiOutlineBookmark />
            </span>
            <div>
              <h3 className="font-bold text-sm text-surface-900 dark:text-white">
                Saved & Held Carts
              </h3>
              <p className="text-[11px] text-surface-400">
                Restore parked orders to resume selling
              </p>
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

        {/* Carts List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {heldCarts.length === 0 ? (
            <div className="py-16 text-center text-surface-400">
              <HiOutlineBookmark className="text-4xl mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
                No orders on hold
              </p>
              <p className="text-[11px] text-surface-400 mt-1">
                You can park an active cart anytime by clicking "Hold" in the cart.
              </p>
            </div>
          ) : (
            heldCarts.map((held) => (
              <div
                key={held.id}
                className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/70 dark:border-surface-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-brand-300 dark:hover:border-brand-500/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-surface-900 dark:text-white">
                      {held.customerName || 'Walk-in Customer'}
                    </span>
                    <span className="text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded-md">
                      {held.itemsCount} {held.itemsCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <p className="text-xs font-black text-brand-600 dark:text-brand-400 font-mono">
                    Total: {fmt(held.total)}
                  </p>
                  <p className="text-[10px] text-surface-400">
                    Parked at{' '}
                    {new Date(held.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {new Date(held.timestamp).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDeleteHeldCart(held.id)}
                    className="p-2 rounded-xl text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    title="Discard held cart"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRecallCart(held)}
                    className="btn-primary py-2 px-3.5 text-xs font-bold rounded-xl"
                  >
                    <HiOutlineArrowUturnLeft className="w-3.5 h-3.5" />
                    <span>Recall Cart</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
