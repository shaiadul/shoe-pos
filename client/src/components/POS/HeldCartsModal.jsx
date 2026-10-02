import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  HiOutlineBookmark, 
  HiOutlineTrash, 
  HiOutlineArrowUturnLeft, 
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineShoppingBag
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

  const modalJSX = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-150 dark:border-surface-800 flex items-center justify-between bg-surface-50/70 dark:bg-surface-850/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-lg">
              <HiOutlineBookmark />
            </span>
            <div>
              <h3 className="font-black text-sm text-surface-900 dark:text-white">
                Parked & Held Orders ({heldCarts.length})
              </h3>
              <p className="text-[11px] text-surface-400">
                Restore parked customer orders to continue selling
              </p>
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

        {/* Carts List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3 pos-scroll">
          {heldCarts.length === 0 ? (
            <div className="py-16 text-center text-surface-400">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <HiOutlineBookmark className="text-2xl" />
              </div>
              <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
                No tickets currently on hold
              </p>
              <p className="text-[11px] text-surface-400 mt-1 max-w-[220px] mx-auto">
                You can temporarily hold an active cart anytime by tapping "Hold" in the cart sidebar.
              </p>
            </div>
          ) : (
            heldCarts.map((held) => {
              const itemsList = held.cart || [];
              const itemsSummary = itemsList
                .map((i) => `${i.name} (${i.size ? `Sz ${i.size}` : ''} ×${i.quantity})`)
                .join(', ');

              return (
                <div
                  key={held.id}
                  className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-850/60 border border-surface-200/80 dark:border-surface-750 flex flex-col gap-2.5 shadow-xs hover:border-brand-400/80 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-surface-900 dark:text-white">
                          {held.customerName || 'Walk-in Customer'}
                        </span>
                        <span className="text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold px-2 py-0.5 rounded-md">
                          {held.itemsCount} {held.itemsCount === 1 ? 'shoe' : 'shoes'}
                        </span>
                      </div>
                      <p className="text-xs font-mono font-black text-brand-600 dark:text-brand-400 mt-0.5">
                        Total: {fmt(held.total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
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
                        className="btn-primary py-2 px-3.5 text-xs font-black rounded-xl shadow-xs"
                      >
                        <HiOutlineArrowUturnLeft className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>

                  {/* Items summary */}
                  {itemsSummary && (
                    <p className="text-[11px] text-surface-500 line-clamp-1 italic">
                      {itemsSummary}
                    </p>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5 text-[10px] text-surface-400 font-medium pt-1 border-t border-surface-150 dark:border-surface-800">
                    <HiOutlineClock className="w-3.5 h-3.5 text-surface-400" />
                    <span>
                      Parked at{' '}
                      {new Date(held.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {new Date(held.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
}
