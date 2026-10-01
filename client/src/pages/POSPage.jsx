import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, customerAPI, orderAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal, Spinner, SearchInput, SkeletonGrid } from '../components/UI';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineUser, 
  HiOutlineTag, 
  HiOutlineTicket, 
  HiOutlineCreditCard, 
  HiOutlineBanknotes, 
  HiOutlineDevicePhoneMobile, 
  HiOutlineArrowsRightLeft,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineReceiptPercent,
  HiOutlineSquares2X2, 
  HiOutlineTableCells, 
  HiOutlinePencilSquare, 
  HiOutlineDocumentDuplicate, 
  HiOutlineArchiveBox,
  HiOutlineShoppingBag,
  HiOutlineQrCode,
  HiOutlinePause,
  HiOutlineBookmark,
  HiOutlineClock
} from 'react-icons/hi2';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: <HiOutlineBanknotes /> },
  { id: 'card', label: 'Card', icon: <HiOutlineCreditCard /> },
  { id: 'mobile_banking', label: 'Mobile', icon: <HiOutlineDevicePhoneMobile /> },
  { id: 'due', label: 'Full Due', icon: <HiOutlineTicket />, needsCustomer: true },
  { id: 'partial', label: 'Partial', icon: <HiOutlineArrowsRightLeft />, needsCustomer: true },
];

export default function POSPage() {
  const { settings, fmt } = useSettings();
  const { user, can } = useAuth();
  const navigate = useNavigate();

  const searchRef = useRef(null);
  const barcodeInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Held carts
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_held_carts') || '[]');
    } catch {
      return [];
    }
  });
  const [showRecallModal, setShowRecallModal] = useState(false);

  // Customer
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', city: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashPaid, setCashPaid] = useState('');
  const [partialPaid, setPartialPaid] = useState('');
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [sizeModal, setSizeModal] = useState(null);

  useEffect(() => { loadProducts(1, '', ''); }, []);

  const loadProducts = async (pg, srch, cat) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const r = await productAPI.getAll({ page: pg, limit: 24, search: srch, category: cat });
      setProducts(prev => pg === 1 ? r.data.products : [...prev, ...r.data.products]);
      setHasMore(pg < r.data.pages);
      setPage(pg);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => loadProducts(1, search, selectedCategory), 300);
    return () => clearTimeout(t);
  }, [search, selectedCategory]);

  useEffect(() => {
    productAPI.getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      try { const r = await customerAPI.search(customerSearch); setCustomerResults(r.data.customers); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // Quick add customer
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) return toast.error('Name is required');
    setSavingCustomer(true);
    try {
      const r = await customerAPI.create(newCustomerForm);
      setCustomer(r.data.customer);
      setShowAddCustomer(false);
      setShowCustomerPanel(false);
      setNewCustomerForm({ name: '', phone: '', city: '' });
      toast.success(`Customer "${r.data.customer.name}" added & selected!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add customer'); }
    finally { setSavingCustomer(false); }
  };

  const openSizeModal = (product) => {
    const flat = {};
    product.variants.forEach(v => {
      if (!flat[v.size]) flat[v.size] = [];
      flat[v.size].push(v);
    });
    setSizeModal({ product, sizes: flat });
  };

  const addToCart = (product, variant) => {
    const key = `${product._id}-${variant.size}-${variant.color}`;
    setCart(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        if (existing.quantity >= variant.stock) { toast.error(`Only ${variant.stock} in stock`); return prev; }
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (variant.stock === 0) { toast.error('Out of stock'); return prev; }
      return [...prev, {
        key, productId: product._id, name: product.name, brand: product.brand,
        size: variant.size, color: variant.color, sku: variant.sku,
        price: product.price, discount: product.discount, stock: variant.stock,
        image: product.images?.[0],
        quantity: 1,
      }];
    });
    toast.success(`${product.name} (${variant.size}) added`, { duration: 1200 });
    setSizeModal(null);
  };

  const updateQty = (key, delta) => {
    setCart(prev => prev.map(i => {
      if (i.key !== key) return i;
      const nq = i.quantity + delta;
      if (nq <= 0) return null;
      if (nq > i.stock) { toast.error(`Only ${i.stock} available`); return i; }
      return { ...i, quantity: nq };
    }).filter(Boolean));
  };

  const removeItem = (key) => setCart(prev => prev.filter(i => i.key !== key));
  const clearCart = () => { setCart([]); setCustomer(null); setOrderDiscount(0); };

  const handleBarcodeKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (!code) return;
      try {
        const res = await productAPI.getByBarcode(code);
        if (res.data?.product && res.data?.matchedVariant) {
          addToCart(res.data.product, res.data.matchedVariant);
          setBarcodeInput('');
        } else {
          toast.error('Barcode not found');
        }
      } catch {
        toast.error(`No item found for barcode: ${code}`);
      }
    }
  };

  const holdCart = () => {
    if (!cart.length) return toast.error('Cart is empty');
    const newHold = {
      id: Date.now().toString(),
      cart: [...cart],
      customer,
      orderDiscount,
      total,
      itemsCount: cart.reduce((s, i) => s + i.quantity, 0),
      timestamp: new Date().toISOString(),
      customerName: customer?.name || 'Walk-in Customer',
    };
    const updated = [newHold, ...heldCarts];
    setHeldCarts(updated);
    localStorage.setItem('pos_held_carts', JSON.stringify(updated));
    clearCart();
    toast.success('Cart placed on hold');
  };

  const recallCart = (held) => {
    setCart(held.cart);
    setCustomer(held.customer || null);
    setOrderDiscount(held.orderDiscount || 0);
    const updated = heldCarts.filter(c => c.id !== held.id);
    setHeldCarts(updated);
    localStorage.setItem('pos_held_carts', JSON.stringify(updated));
    setShowRecallModal(false);
    toast.success('Cart restored');
  };

  const deleteHeldCart = (id) => {
    const updated = heldCarts.filter(c => c.id !== id);
    setHeldCarts(updated);
    localStorage.setItem('pos_held_carts', JSON.stringify(updated));
    toast.success('Held cart removed');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus?.();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setShowCheckout(true);
      } else if (e.key === 'Escape') {
        setShowCheckout(false);
        setSizeModal(null);
        setShowRecallModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]);

  // Calculations
  const { subtotal, discountAmt, afterDiscount, taxAmt, total, cashChange, partialDue, effectivePaid, dueAmount } = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.price * i.quantity * (1 - i.discount / 100), 0);
    const disc = sub * orderDiscount / 100;
    const after = sub - disc;
    const tax = after * (settings.taxRate || 0) / 100;
    const tot = after + tax;
    const change = paymentMethod === 'cash' ? (parseFloat(cashPaid) || 0) - tot : 0;
    const pDue = paymentMethod === 'partial' ? tot - (parseFloat(partialPaid) || 0) : 0;
    const effPaid = paymentMethod === 'due' ? 0 :
                          paymentMethod === 'partial' ? parseFloat(partialPaid) || 0 :
                          paymentMethod === 'cash' ? Math.min(parseFloat(cashPaid) || tot, tot) :
                          tot;
    const due = Math.max(0, tot - effPaid);
    
    return { subtotal: sub, discountAmt: disc, afterDiscount: after, taxAmt: tax, total: tot, cashChange: change, partialDue: pDue, effectivePaid: effPaid, dueAmount: due };
  }, [cart, orderDiscount, settings.taxRate, paymentMethod, cashPaid, partialPaid]);

  // Validate checkout
  const needsCustomer = ['due', 'partial'].includes(paymentMethod) || settings.requireCustomer;
  const canCheckout = cart.length > 0 &&
    (!needsCustomer || customer) &&
    (paymentMethod !== 'cash' || !cashPaid || parseFloat(cashPaid) >= total) &&
    (paymentMethod !== 'partial' || (parseFloat(partialPaid) > 0 && parseFloat(partialPaid) < total));

  const handleCheckout = async () => {
    if (!cart.length) return toast.error('Cart is empty');
    if (needsCustomer && !customer) return toast.error('Please select a customer for this payment type');
    setProcessingOrder(true);
    try {
      const items = cart.map(i => ({
        product: i.productId, name: i.name, brand: i.brand,
        size: i.size, color: i.color, sku: i.sku,
        price: i.price, discount: i.discount, quantity: i.quantity,
        total: i.price * i.quantity * (1 - i.discount / 100),
      }));
      const r = await orderAPI.create({
        items,
        customer: customer?._id,
        customerName: customer?.name || 'Walk-in Customer',
        subtotal, discountAmount: discountAmt, taxAmount: taxAmt,
        taxRate: settings.taxRate, taxName: settings.taxName,
        total,
        paidAmount: effectivePaid,
        paymentMethod,
        paymentDetails: {
          cashPaid: paymentMethod === 'cash' ? parseFloat(cashPaid) || total : effectivePaid,
          change: Math.max(0, cashChange),
          dueNote: paymentMethod === 'due' ? 'Full due sale' : paymentMethod === 'partial' ? `Partial: paid ${fmt(effectivePaid)}, due ${fmt(dueAmount)}` : '',
        },
      });
      setCompletedOrder(r.data.order);
      setShowCheckout(false);
      setShowReceipt(true);
      clearCart();
      toast.success('Order completed! 🎉');
      
      if (settings.autoPrintReceipt) {
        setTimeout(() => printReceipt(r.data.order), 500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally { setProcessingOrder(false); }
  };

  const printReceipt = (orderData) => {
    const o = orderData?.orderNumber ? orderData : completedOrder;
    if (!o) return;
    const doc = new jsPDF({ format: [80, 220], unit: 'mm' });
    let y = 10;
    
    const pdfFmt = (amount) => `BDT ${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;
    
    const drawDashedLine = (yPos) => {
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(5, yPos, 75, yPos);
      doc.setLineDashPattern([], 0); // reset
    };

    // Header
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text((settings.storeName || 'SoleMate POS').toUpperCase(), 40, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    const headerInfo = [settings.storeAddress, settings.storePhone, settings.storeEmail].filter(Boolean);
    headerInfo.forEach(text => { 
      const lines = doc.splitTextToSize(text, 70);
      doc.text(lines, 40, y, { align: 'center' }); 
      y += 4 * lines.length; 
    });
    
    y += 1;
    drawDashedLine(y);
    y += 5;

    // Order Info
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('INVOICE:', 5, y); doc.setFont('helvetica', 'normal'); doc.text(`#${o.orderNumber}`, 22, y);
    doc.text(format(new Date(o.createdAt), 'dd/MM/yyyy HH:mm'), 75, y, { align: 'right' });
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.text('CUSTOMER:', 5, y); doc.setFont('helvetica', 'normal'); doc.text(o.customerName, 26, y);
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.text('CASHIER:', 5, y); doc.setFont('helvetica', 'normal'); doc.text(o.cashierName || 'System', 22, y);
    y += 6;

    // Items Table
    autoTable(doc, {
      startY: y,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: o.items.map(i => [
        `${i.name}\n${i.brand ? i.brand + ' - ' : ''}${i.size}`,
        i.quantity,
        i.price.toLocaleString(),
        i.total.toFixed(0)
      ]),
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak', font: 'helvetica' },
      headStyles: { fontStyle: 'bold', borderBottomWidth: 0.5, borderBottomColor: 200 },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { halign: 'center', cellWidth: 10 },
        2: { halign: 'right', cellWidth: 15 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 15 }
      },
      margin: { left: 5, right: 5 }
    });

    y = doc.lastAutoTable.finalY + 4;
    drawDashedLine(y);
    y += 5;

    // Summary
    const summaryX = 40;
    const valueX = 75;
    const rowH = 4.5;
    
    doc.setFontSize(8);
    const rows = [
      ['Subtotal', pdfFmt(o.subtotal)],
      o.discountAmount > 0 ? ['Discount', `-${pdfFmt(o.discountAmount)}`] : null,
      o.taxAmount > 0 ? [`${o.taxName || settings.taxName || 'Tax'} ${o.taxRate ? '(' + o.taxRate + '%)' : ''}`, pdfFmt(o.taxAmount)] : null,
      ['TOTAL', pdfFmt(o.total), true],
      ['Paid', pdfFmt(o.paidAmount)],
      o.dueAmount > 0 ? ['DUE BALANCE', pdfFmt(o.dueAmount), true, [220, 38, 38]] : null,
    ].filter(Boolean);

    rows.forEach(([label, value, isBold, color]) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      if (color) doc.setTextColor(...color);
      doc.text(label, summaryX, y);
      doc.text(value, valueX, y, { align: 'right' });
      doc.setTextColor(0);
      y += rowH;
    });

    if (o.paymentDetails?.change > 0) {
      y += 1;
      doc.setFont('helvetica', 'normal');
      doc.text('Change Given', summaryX, y);
      doc.text(pdfFmt(o.paymentDetails.change), valueX, y, { align: 'right' });
      y += rowH;
    }

    y += 3;
    drawDashedLine(y);
    y += 6;
    doc.setFontSize(8); doc.setFont('helvetica', 'italic');
    
    const footerLines = doc.splitTextToSize(settings.receiptFooter || 'Thank you for your business!', 70);
    doc.text(footerLines, 40, y, { align: 'center' });
    y += 4 * footerLines.length;

    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(150);
    doc.text('Powered by SoleMate POS', 40, y, { align: 'center' });

    doc.save(`receipt-${o.orderNumber}.pdf`);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-surface-200 dark:border-surface-800">
        {/* Filters */}
        <div className="p-3 border-b border-surface-100 dark:border-surface-800 flex gap-2 flex-wrap items-center">
          <div className="flex-1 min-w-[180px]">
            <SearchInput
              inputRef={searchRef}
              value={search}
              onChange={setSearch}
              placeholder="Search shoes, brand, SKU… (F2)"
              icon={<HiOutlineMagnifyingGlass />}
            />
          </div>
          <div className="relative w-48">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan Barcode (Enter)…"
              className="input pl-8 pr-2 text-xs py-2 font-mono"
            />
            <span className="absolute left-2.5 top-2.5 text-surface-400 text-sm">
              <HiOutlineQrCode />
            </span>
          </div>
          <div className="hidden xl:flex items-center text-[10px] text-surface-400 font-mono bg-surface-100 dark:bg-surface-800 px-2 py-1.5 rounded-lg border border-surface-200/50 dark:border-surface-700/50">
            <span>F2: Search · F9: Pay · Esc: Close</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            <button onClick={() => setSelectedCategory('')}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${!selectedCategory ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${cat === selectedCategory ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <SkeletonGrid count={12} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {products.map(product => {
                  const hasStock = product.totalStock > 0;
                  const discPrice = product.price * (1 - product.discount / 100);
                  return (
                    <motion.div key={product._id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                      className={`pos-product-card group relative bg-white dark:bg-surface-900 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] ${!hasStock ? 'opacity-50' : ''}`}
                      onClick={() => hasStock && openSizeModal(product)}>
                      {product.discount > 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-lg">-{product.discount}%</div>
                      )}
                      {!hasStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface-900/60 rounded-2xl z-10 backdrop-blur-[2px]">
                          <span className="text-[10px] font-black text-white bg-red-500 px-3 py-1 rounded-full shadow-lg">OUT OF STOCK</span>
                        </div>
                      )}
                      <div className="aspect-square bg-surface-50 dark:bg-surface-800 rounded-2xl mb-3 flex items-center justify-center overflow-hidden border border-surface-100 dark:border-surface-800 group-hover:border-brand-200 transition-colors">
                        {product.images?.[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=No+Image'; }}
                          />
                        ) : <HiOutlineArchiveBox className="text-4xl text-surface-200" />}
                      </div>
                      <p className="text-[12px] font-black text-surface-950 dark:text-white truncate tracking-tight">{product.name}</p>
                      <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{product.brand}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-50 dark:border-surface-800">
                        <div>
                          <p className="text-sm font-black text-brand-500 tracking-tight">{fmt(discPrice)}</p>
                          {product.discount > 0 && <p className="text-[10px] text-surface-400 line-through opacity-60 font-medium">{fmt(product.price)}</p>}
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${product.totalStock <= 5 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {product.totalStock}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <button onClick={() => loadProducts(page + 1, search, selectedCategory)} disabled={loadingMore} className="btn-secondary py-2 px-6 text-xs">
                    {loadingMore ? <Spinner size="sm" /> : 'Load more'}
                  </button>
                </div>
              )}
              {!loading && products.length === 0 && (
                <div className="text-center py-20">
                  <HiOutlineArchiveBox className="text-5xl mx-auto mb-3 text-surface-200" />
                  <p className="text-surface-400">No products found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right: Cart panel */}
      <div className="w-80 xl:w-96 flex flex-col bg-white dark:bg-surface-950 shrink-0">
        {/* Cart header */}
        <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-surface-900 dark:text-white text-sm">Cart</span>
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
            {heldCarts.length > 0 && (
              <button
                onClick={() => setShowRecallModal(true)}
                className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 hover:bg-amber-200 transition-colors"
                title="View held carts"
              >
                <HiOutlineBookmark className="text-xs" />
                <span>Held ({heldCarts.length})</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={holdCart}
                className="text-xs text-surface-500 hover:text-amber-500 flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors"
                title="Hold this cart"
              >
                <HiOutlinePause className="text-xs" /> Hold
              </button>
            )}
            <button onClick={() => setShowCustomerPanel(s => !s)}
              className={`text-xs font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-lg ${customer ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-surface-500 hover:text-brand-500'}`}>
              {customer ? (
                <span className="flex items-center gap-1"><HiOutlineUser /> {customer.name.split(' ')[0]}</span>
              ) : (
                <span className="flex items-center gap-1"><HiOutlinePlus /> Customer</span>
              )}
              {customer?.dueBalance > 0 && (
                <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1 py-0.5 rounded font-bold">
                  Due {fmt(customer.dueBalance)}
                </span>
              )}
            </button>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 transition-colors">Clear</button>
            )}
          </div>
        </div>

        {/* Customer selector panel */}
        <AnimatePresence>
          {showCustomerPanel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 overflow-hidden">
              <div className="p-3 space-y-2">
                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search by name or phone…" className="input text-xs py-2" autoFocus />
                {customerResults.map(c => (
                  <button key={c._id} onClick={() => { setCustomer(c); setCustomerSearch(''); setShowCustomerPanel(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-surface-700 transition-colors border border-transparent hover:border-brand-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-surface-800 dark:text-surface-200">{c.name}</p>
                        <p className="text-[10px] text-surface-400">{c.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-purple-500 font-bold flex items-center gap-0.5 justify-end"><HiOutlineTag className="text-[9px]" /> {c.loyaltyPoints} pts</p>
                        {c.dueBalance > 0 && <p className="text-[10px] text-red-500 font-bold">Due: {fmt(c.dueBalance)}</p>}
                      </div>
                    </div>
                  </button>
                ))}
                <div className="flex gap-2 pt-1">
                  {customer && (
                    <button onClick={() => { setCustomer(null); setShowCustomerPanel(false); }}
                      className="flex-1 py-1.5 rounded-xl text-xs text-red-500 border border-red-200 dark:border-red-900 hover:bg-red-50 transition-colors">
                      Remove customer
                    </button>
                  )}
                  <button onClick={() => { setShowAddCustomer(true); setShowCustomerPanel(false); }}
                    className="flex-1 py-1.5 rounded-xl text-xs bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors">
                    + New Customer
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div key={item.key}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex gap-2.5 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                <div className="w-10 h-10 rounded-lg bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=N/A'; }}
                    />
                  ) : <HiOutlineArchiveBox className="text-surface-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-surface-800 dark:text-surface-200 truncate">{item.name}</p>
                  <p className="text-[10px] text-surface-400">{item.size} · {item.color}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.key, -1)} className="w-5 h-5 rounded-md bg-surface-200 dark:bg-surface-700 text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors flex items-center justify-center">−</button>
                      <span className="text-xs font-bold text-surface-800 dark:text-surface-200 w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.key, 1)} className="w-5 h-5 rounded-md bg-surface-200 dark:bg-surface-700 text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors flex items-center justify-center">+</button>
                    </div>
                    <p className="text-xs font-extrabold text-brand-500">{fmt(item.price * item.quantity * (1 - item.discount / 100))}</p>
                    <button onClick={() => removeItem(item.key)} className="text-surface-300 hover:text-red-500 transition-colors text-sm">×</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="text-center py-16">
              <HiOutlineShoppingBag className="text-4xl mx-auto mb-3 opacity-20" />
              <p className="text-xs text-surface-400">Cart is empty</p>
              <p className="text-[11px] text-surface-300 mt-1">Click products to add</p>
            </div>
          )}
        </div>

        {/* Cart summary */}
        {cart.length > 0 && (
          <div className="border-t border-surface-100 dark:border-surface-800 p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-surface-500">
                <span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-surface-500">
                <span>Discount</span>
                <div className="flex items-center gap-1">
                  <input type="number" min={0} max={100} value={orderDiscount}
                    onChange={e => setOrderDiscount(Number(e.target.value))}
                    className="w-10 text-right bg-transparent border-b border-surface-300 dark:border-surface-600 text-xs font-semibold focus:outline-none focus:border-brand-400" />
                  <span>%</span>
                  {discountAmt > 0 && <span className="text-brand-500 font-semibold">-{fmt(discountAmt)}</span>}
                </div>
              </div>
              {settings.taxRate > 0 && (
                <div className="flex justify-between text-xs text-surface-500">
                  <span>{settings.taxName} ({settings.taxRate}%)</span><span className="font-semibold">{fmt(taxAmt)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-surface-900 dark:text-white pt-2 border-t border-surface-100 dark:border-surface-800">
                <span>Total</span><span className="text-brand-500 text-base">{fmt(total)}</span>
              </div>
            </div>
            <button onClick={() => setShowCheckout(true)} className="btn-primary w-full justify-center py-4 text-base shadow-[0_20px_50px_rgba(236,72,153,0.3)] rounded-2xl active:scale-95 transition-all">
              Complete Order — {fmt(total)}
            </button>
          </div>
        )}
      </div>

      {/* Size selector modal */}
      <AnimatePresence>
        {sizeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setSizeModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-surface-900 dark:text-white">{sizeModal.product.name}</p>
                  <p className="text-xs text-surface-400">{sizeModal.product.brand} · Select size & color</p>
                </div>
                <button onClick={() => setSizeModal(null)} className="w-8 h-8 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors">✕</button>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {Object.entries(sizeModal.sizes).map(([size, variants]) => (
                  <div key={size} className="mb-4">
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Size {size}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {variants.map(variant => (
                        <button key={`${variant.size}-${variant.color}`}
                          onClick={() => variant.stock > 0 && addToCart(sizeModal.product, variant)}
                          disabled={variant.stock === 0}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-all
                            ${variant.stock === 0
                              ? 'border-surface-200 dark:border-surface-700 text-surface-300 bg-surface-50 dark:bg-surface-800 cursor-not-allowed opacity-50'
                              : 'border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 hover:bg-brand-500 hover:text-white hover:border-brand-500 active:scale-95'}`}>
                          <p>{variant.color}</p>
                          <p className={`text-[9px] mt-0.5 ${variant.stock <= 3 ? 'text-red-400' : 'text-surface-400'}`}>
                            {variant.stock === 0 ? 'Out' : `${variant.stock} left`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Customer Modal */}
      <Modal open={showAddCustomer} onClose={() => setShowAddCustomer(false)} title="Quick Add Customer" size="sm">
        <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input required value={newCustomerForm.name} onChange={e => setNewCustomerForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="Customer name" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input value={newCustomerForm.phone} onChange={e => setNewCustomerForm(f => ({ ...f, phone: e.target.value }))}
                className="input" placeholder="01700..." />
            </div>
            <div>
              <label className="label">City</label>
              <input value={newCustomerForm.city} onChange={e => setNewCustomerForm(f => ({ ...f, city: e.target.value }))}
                className="input" placeholder="Dhaka" />
            </div>
          </div>
          <div className="flex gap-2 pt-1 border-t border-surface-100 dark:border-surface-800">
            <button type="button" onClick={() => setShowAddCustomer(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={savingCustomer} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {savingCustomer ? 'Adding…' : '+ Add & Select'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Checkout modal */}
      <Modal open={showCheckout} onClose={() => setShowCheckout(false)} title="Checkout" size="sm">
        <div className="p-5 space-y-4">
          {/* Order summary */}
          <div className="space-y-1.5 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl text-xs">
            {cart.slice(0, 3).map(i => (
              <div key={i.key} className="flex justify-between text-surface-600 dark:text-surface-400">
                <span>{i.name} ({i.size}) × {i.quantity}</span>
                <span>{fmt(i.price * i.quantity * (1 - i.discount / 100))}</span>
              </div>
            ))}
            {cart.length > 3 && <p className="text-surface-400">+{cart.length - 3} more…</p>}
            <div className="border-t border-surface-200 dark:border-surface-700 pt-2 mt-2 flex justify-between font-extrabold text-sm text-surface-900 dark:text-white">
              <span>Total</span><span className="text-brand-500">{fmt(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="label">Payment method</label>
            <div className="grid grid-cols-5 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`p-2 rounded-xl border text-[10px] font-semibold transition-all flex flex-col items-center gap-1
                    ${paymentMethod === m.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-brand-300'}
                    ${m.needsCustomer && !customer ? 'opacity-60' : ''}`}>
                  <span className="text-lg">{m.icon}</span>
                  {m.label}
                  {m.needsCustomer && <span className="text-[8px] text-brand-400">needs customer</span>}
                </button>
              ))}
            </div>
            {needsCustomer && !customer && (
              <div className="mt-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                <span>⚠</span>
                <span>Please select a customer first for due/partial payments.</span>
              </div>
            )}
          </div>

          {/* Cash input */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="label">Cash received</label>
              <input type="number" value={cashPaid} onChange={e => setCashPaid(e.target.value)}
                placeholder={total.toFixed(0)} className="input text-center text-lg font-bold" />
              {cashChange > 0 && (
                <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex justify-between text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  <span>Change</span><span>{fmt(cashChange)}</span>
                </div>
              )}
              {parseFloat(cashPaid) > 0 && parseFloat(cashPaid) < total && (
                <p className="text-xs text-red-500 mt-1.5 text-center">Short by {fmt(total - parseFloat(cashPaid))}</p>
              )}
            </div>
          )}

          {/* Partial payment */}
          {paymentMethod === 'partial' && (
            <div>
              <label className="label">Amount paid now</label>
              <input type="number" min={1} max={total - 1} value={partialPaid} onChange={e => setPartialPaid(e.target.value)}
                placeholder="Enter partial amount" className="input text-center text-lg font-bold" />
              {parseFloat(partialPaid) > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex justify-between text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <span>Paid now</span><span>{fmt(parseFloat(partialPaid))}</span>
                  </div>
                  {partialDue > 0 && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl flex justify-between text-sm font-bold text-red-700 dark:text-red-400">
                      <span>Remaining due</span><span>{fmt(partialDue)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full due */}
          {paymentMethod === 'due' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm font-bold text-red-700 dark:text-red-400 flex justify-between">
              <span>Full amount to be collected later</span>
              <span>{fmt(total)}</span>
            </div>
          )}

          {/* Customer info */}
          {customer && (
            <div className="p-2.5 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-xs text-brand-700 dark:text-brand-300 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>👤 {customer.name}</span>
                <span className="font-bold">✦ {customer.loyaltyPoints} pts</span>
              </div>
              {customer.dueBalance > 0 && (
                <p className="text-red-500 font-bold">⚠ Existing due: {fmt(customer.dueBalance)}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowCheckout(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleCheckout} disabled={processingOrder || !canCheckout}
              className="btn-primary flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30">
              {processingOrder
                ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : `✓ Confirm ${fmt(total)}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt modal */}
      <Modal open={showReceipt} onClose={() => setShowReceipt(false)} title="Order Complete!" size="sm">
        {completedOrder && (
          <div className="p-5">
            <div className="text-center mb-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
                className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl mx-auto mb-3">
                ✓
              </motion.div>
              <p className="font-extrabold text-surface-900 dark:text-white text-lg">Sale Complete!</p>
              <p className="text-xs text-surface-400 mt-0.5">Order #{completedOrder.orderNumber}</p>
            </div>

            <div className="space-y-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl text-xs mb-4">
              <div className="flex justify-between"><span className="text-surface-500">Customer</span><span className="font-semibold">{completedOrder.customerName}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Payment</span><span className="font-semibold capitalize">{completedOrder.paymentMethod.replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Paid</span><span className="font-bold text-emerald-600">{fmt(completedOrder.paidAmount)}</span></div>
              {completedOrder.dueAmount > 0 && (
                <div className="flex justify-between font-bold text-red-600 dark:text-red-400">
                  <span>⚠ Due Balance</span><span>{fmt(completedOrder.dueAmount)}</span>
                </div>
              )}
              {completedOrder.paymentDetails?.change > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Change given</span><span className="font-bold">{fmt(completedOrder.paymentDetails.change)}</span></div>
              )}
              <div className="flex justify-between text-base font-extrabold text-surface-900 dark:text-white border-t border-surface-200 dark:border-surface-700 pt-2 mt-1">
                <span>Total</span><span className="text-brand-500">{fmt(completedOrder.total)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowReceipt(false)} className="btn-secondary flex-1 justify-center">New Sale</button>
              <button onClick={() => printReceipt(completedOrder)} className="btn-primary flex-1 justify-center">⬇ PDF Receipt</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Held Carts modal */}
      <Modal open={showRecallModal} onClose={() => setShowRecallModal(false)} title="Saved & Held Carts" size="md">
        <div className="p-6 space-y-4">
          {heldCarts.length === 0 ? (
            <div className="text-center py-8 text-surface-400 text-xs">
              <HiOutlineBookmark className="text-3xl mx-auto mb-2 opacity-50" />
              <p>No held carts at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {heldCarts.map((held) => (
                <div key={held.id} className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-100 dark:border-surface-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-surface-900 dark:text-white">
                        {held.customerName}
                      </span>
                      <span className="text-[10px] bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 font-bold px-2 py-0.5 rounded-md">
                        {held.itemsCount} item{held.itemsCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-brand-500">
                      Total: {fmt(held.total)}
                    </p>
                    <p className="text-[10px] text-surface-400">
                      Saved {new Date(held.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(held.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteHeldCart(held.id)}
                      className="btn-ghost p-2 text-surface-400 hover:text-red-500 rounded-lg text-xs"
                      title="Discard held cart"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                    <button
                      onClick={() => recallCart(held)}
                      className="btn-primary py-2 px-4 text-xs font-bold"
                    >
                      Recall to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
