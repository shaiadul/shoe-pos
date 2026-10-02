import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  HiOutlinePrinter, 
  HiOutlineArrowDownTray, 
  HiOutlineArrowPath, 
  HiOutlineCheckCircle, 
  HiOutlineXMark 
} from 'react-icons/hi2';
import { generateReceiptPDF } from '../../utils/receiptGenerator';

export default function POSReceiptModal({
  open,
  onClose,
  order,
  settings = {},
  onNewSale,
}) {
  const printAreaRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      if (e.key === 'F4' || e.key === ' ') {
        e.preventDefault();
        onNewSale();
      } else if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDirectPrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, order]);

  if (!open || !order) return null;

  const handleDirectPrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateReceiptPDF(order, settings);
  };

  const currencySymbol = settings.currencySymbol || '৳';

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

  const modalJSX = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="bg-surface-100 dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col my-auto"
      >
        {/* Top Success Banner */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center gap-2">
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-200" />
            <span className="text-xs font-black uppercase tracking-wider">
              Sale Completed Successfully 🎉
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] flex flex-col items-center bg-surface-200/50 dark:bg-surface-950/60 pos-scroll">
          {/* Authentic POS Thermal Slip with Sawtooth Edges */}
          <div className="w-full max-w-[340px] drop-shadow-xl select-text">
            {/* Top Sawtooth cut */}
            <div className="receipt-sawtooth-top" />

            <div
              id="pos-receipt-print-area"
              ref={printAreaRef}
              className="thermal-receipt-paper w-full p-5 text-gray-900 font-mono text-xs border-x border-gray-300"
            >
              {/* Header: Store Info */}
              <div className="text-center space-y-1 pb-3">
                <h2 className="text-base font-black tracking-tight uppercase text-black">
                  {settings.storeName || 'SoleMate Footwear'}
                </h2>
                {settings.storeAddress && (
                  <p className="text-[11px] leading-tight text-gray-600">
                    {settings.storeAddress}
                  </p>
                )}
                {settings.storePhone && (
                  <p className="text-[11px] leading-tight text-gray-600">
                    Tel: {settings.storePhone}
                  </p>
                )}
                {settings.storeEmail && (
                  <p className="text-[10px] leading-tight text-gray-500">
                    {settings.storeEmail}
                  </p>
                )}
              </div>

              {/* Dashed line */}
              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Receipt Meta info */}
              <div className="text-[11px] space-y-1 text-gray-700">
                <div className="flex justify-between items-center">
                  <span>
                    <strong className="text-black">Invoice:</strong> #{order.orderNumber}
                  </span>
                  <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-gray-200 text-black">
                    {order.paymentMethod?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>
                    <strong>Date:</strong> {format(orderDate, 'dd/MM/yyyy')}
                  </span>
                  <span>{format(orderDate, 'hh:mm a')}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="truncate max-w-[200px]">
                    <strong>Customer:</strong> {order.customerName || 'Walk-in'}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Cashier: {order.cashierName || 'Staff'}
                  </span>
                </div>
              </div>

              {/* Dashed line */}
              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Table Header with Tabular Alignment */}
              <div className="grid grid-cols-12 gap-1 text-[10px] font-black uppercase text-black border-b border-dashed border-gray-400 pb-1 mb-1.5">
                <div className="col-span-5 text-left">ITEM / SPEC</div>
                <div className="col-span-2 text-center">QTY</div>
                <div className="col-span-2 text-right">RATE</div>
                <div className="col-span-3 text-right">TOTAL</div>
              </div>

              {/* Table Items */}
              <div className="space-y-1.5 text-[11px]">
                {order.items?.map((item, idx) => {
                  const variantSpec = [
                    item.brand,
                    item.size ? `Sz ${item.size}` : '',
                    item.color,
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-1 items-start leading-tight"
                    >
                      <div className="col-span-5 text-left pr-1">
                        <p className="font-bold text-black truncate">{item.name}</p>
                        {variantSpec && (
                          <p className="text-[9px] text-gray-500 truncate">{variantSpec}</p>
                        )}
                      </div>
                      <div className="col-span-2 text-center font-bold tabular-nums">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right tabular-nums text-gray-700">
                        {formatNumber(item.price)}
                      </div>
                      <div className="col-span-3 text-right font-black tabular-nums text-black">
                        {formatNumber(item.total)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dashed line */}
              <div className="border-b border-dashed border-gray-400 my-2.5" />

              {/* Financial Summary */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-bold tabular-nums">
                    {currencySymbol} {formatNumber(order.subtotal)}
                  </span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Discount:</span>
                    <span className="font-bold tabular-nums text-black">
                      -{currencySymbol} {formatNumber(order.discountAmount)}
                    </span>
                  </div>
                )}

                {order.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-gray-700">
                    <span>
                      {order.taxName || settings.taxName || 'Tax'} (
                      {order.taxRate || settings.taxRate || 0}%):
                    </span>
                    <span className="font-bold tabular-nums">
                      +{currencySymbol} {formatNumber(order.taxAmount)}
                    </span>
                  </div>
                )}

                {/* Solid Total Divider */}
                <div className="border-b-2 border-black my-1.5" />

                <div className="flex justify-between items-baseline text-black font-black text-sm pt-0.5">
                  <span className="tracking-wide">TOTAL:</span>
                  <span className="text-base font-black tabular-nums">
                    {currencySymbol} {formatNumber(order.total)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-700 pt-1 text-[11px]">
                  <span>Amount Paid:</span>
                  <span className="font-bold tabular-nums text-black">
                    {currencySymbol} {formatNumber(order.paidAmount)}
                  </span>
                </div>

                {order.paymentDetails?.change > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold text-[11px]">
                    <span>Change Given:</span>
                    <span className="tabular-nums">
                      {currencySymbol} {formatNumber(order.paymentDetails.change)}
                    </span>
                  </div>
                )}

                {order.dueAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600 font-black text-[11px] pt-0.5">
                    <span>DUE BALANCE:</span>
                    <span className="tabular-nums">
                      {currencySymbol} {formatNumber(order.dueAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Dashed line */}
              <div className="border-b border-dashed border-gray-400 my-3" />

              {/* Footer Thank You & Barcode Simulation */}
              <div className="text-center space-y-2 pt-1">
                <p className="text-[10px] text-gray-600 italic">
                  {settings.receiptFooter || 'Footwear exchange accepted within 7 days with receipt & intact box.'}
                </p>

                {/* Barcode Graphic Simulation */}
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="tracking-[3px] font-mono text-sm font-bold text-gray-800">
                    ||||| | |||| ||| |||| | |||||
                  </div>
                  <p className="text-[9px] tracking-widest text-gray-500 font-mono">
                    *{order.orderNumber}*
                  </p>
                </div>

                <p className="text-[8px] text-gray-400 uppercase tracking-widest pt-1">
                  SoleMate Footwear POS
                </p>
              </div>
            </div>

            {/* Bottom Sawtooth cut */}
            <div className="receipt-sawtooth-bottom" />
          </div>
        </div>

        {/* Modal Action Controls (No-Print) */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex flex-col sm:flex-row gap-2.5 no-print">
          <button
            type="button"
            onClick={handleDirectPrint}
            className="btn-primary flex-1 justify-center py-3 text-xs font-black rounded-xl shadow-md shadow-brand-500/20"
          >
            <HiOutlinePrinter className="w-4 h-4 text-base" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="btn-secondary flex-1 justify-center py-3 text-xs font-bold rounded-xl"
          >
            <HiOutlineArrowDownTray className="w-4 h-4 text-base" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={onNewSale}
            className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-md shadow-emerald-600/20"
            title="Start new sale (F4 or Space)"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
            <span>Next Customer</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
}
