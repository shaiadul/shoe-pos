import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, customerAPI, orderAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Modal, Spinner, SearchInput } from '../components/UI';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'mobile_banking', label: 'Mobile', icon: '📱' },
  { id: 'due', label: 'Full Due', icon: '📋', needsCustomer: true },
  { id: 'partial', label: 'Partial', icon: '🔀', needsCustomer: true },
];

export default function POSPage() {
  const { settings, fmt } = useSettings();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
        quantity: 1,
      }];
    });
    toast.success(`${product.name} (${variant.size}) added`, { duration: 1200, icon: '👟' });
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

  // Calculations
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity * (1 - i.discount / 100), 0);
  const discountAmt = subtotal * orderDiscount / 100;
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = afterDiscount * (settings.taxRate || 0) / 100;
  const total = afterDiscount + taxAmt;
  const cashChange = paymentMethod === 'cash' ? (parseFloat(cashPaid) || 0) - total : 0;
  const partialDue = paymentMethod === 'partial' ? total - (parseFloat(partialPaid) || 0) : 0;
  const effectivePaid = paymentMethod === 'due' ? 0 :
                        paymentMethod === 'partial' ? parseFloat(partialPaid) || 0 :
                        paymentMethod === 'cash' ? Math.min(parseFloat(cashPaid) || total, total) :
                        total;
  const dueAmount = Math.max(0, total - effectivePaid);

  // Validate checkout
  const needsCustomer = ['due', 'partial'].includes(paymentMethod);
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
        subtotal, discountAmount: discountAmt, taxAmount: taxAmt, total,
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally { setProcessingOrder(false); }
  };

  const printReceipt = () => {
    const doc = new jsPDF({ format: [80, 220], unit: 'mm' });
    const o = completedOrder;
    let y = 8;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(settings.storeName, 40, y, { align: 'center' }); y += 5;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    if (settings.storeAddress) { doc.text(settings.storeAddress, 40, y, { align: 'center' }); y += 4; }
    if (settings.storePhone) { doc.text(settings.storePhone, 40, y, { align: 'center' }); y += 4; }
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text(`#${o.orderNumber}`, 5, y); doc.text(new Date(o.createdAt).toLocaleString(), 75, y, { align: 'right' }); y += 4;
    doc.text(`Customer: ${o.customerName}`, 5, y); y += 4;
    doc.text(`Cashier: ${o.cashierName}`, 5, y); y += 4;
    doc.line(5, y, 75, y); y += 4;
    doc.setFont('helvetica', 'normal');
    o.items.forEach(item => {
      doc.text(`${item.name} (${item.size}) × ${item.quantity}`, 5, y); y += 3.5;
      doc.text(`  BDT ${item.price.toLocaleString()}`, 5, y);
      doc.text(`BDT ${item.total.toFixed(0)}`, 75, y, { align: 'right' }); y += 5;
    });
    doc.line(5, y, 75, y); y += 3;
    const rows = [
      ['Subtotal', fmt(o.subtotal)],
      o.discountAmount > 0 ? ['Discount', `-${fmt(o.discountAmount)}`] : null,
      o.taxAmount > 0 ? [`${settings.taxName} (${settings.taxRate}%)`, fmt(o.taxAmount)] : null,
      ['TOTAL', fmt(o.total)],
      ['Paid', fmt(o.paidAmount)],
      o.dueAmount > 0 ? ['DUE BALANCE', fmt(o.dueAmount)] : null,
    ].filter(Boolean);
    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', ['TOTAL','DUE BALANCE'].includes(label) ? 'bold' : 'normal');
      doc.setFontSize(['TOTAL','DUE BALANCE'].includes(label) ? 9 : 7.5);
      if (label === 'DUE BALANCE') doc.setTextColor(220, 38, 38);
      doc.text(label, 5, y); doc.text(value, 75, y, { align: 'right' }); y += 4;
      doc.setTextColor(0, 0, 0);
    });
    if (o.paymentDetails?.change > 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text(`Change: ${fmt(o.paymentDetails.change)}`, 5, y); y += 4;
    }
    doc.line(5, y, 75, y); y += 4;
    doc.setFontSize(7); doc.text(settings.receiptFooter || 'Thank you!', 40, y, { align: 'center' });
    doc.save(`receipt-${o.orderNumber}.pdf`);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-surface-200 dark:border-surface-800">
        {/* Filters */}
        <div className="p-3 border-b border-surface-100 dark:border-surface-800 flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search shoes, brand, SKU…" />
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
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {products.map(product => {
                  const hasStock = product.totalStock > 0;
                  const discPrice = product.price * (1 - product.discount / 100);
                  return (
                    <motion.div key={product._id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className={`pos-product-card relative ${!hasStock ? 'opacity-50' : ''}`}
                      onClick={() => hasStock && openSizeModal(product)}>
                      {product.discount > 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">-{product.discount}%</div>
                      )}
                      {!hasStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface-900/60 rounded-2xl z-10">
                          <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">OUT OF STOCK</span>
                        </div>
                      )}
                      <div className="aspect-square bg-surface-100 dark:bg-surface-800 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : <span className="text-4xl">👟</span>}
                      </div>
                      <p className="text-[11px] font-bold text-surface-800 dark:text-surface-200 truncate">{product.name}</p>
                      <p className="text-[10px] text-surface-400 truncate">{product.brand}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div>
                          <p className="text-xs font-extrabold text-brand-500">{fmt(discPrice)}</p>
                          {product.discount > 0 && <p className="text-[9px] text-surface-400 line-through">{fmt(product.price)}</p>}
                        </div>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${product.totalStock <= 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
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
                <div className="text-center py-20"><p className="text-5xl mb-3">👟</p><p className="text-surface-400">No products found</p></div>
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
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCustomerPanel(s => !s)}
              className={`text-xs font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-lg ${customer ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-surface-500 hover:text-brand-500'}`}>
              {customer ? `👤 ${customer.name.split(' ')[0]}` : '+ Customer'}
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
                        <p className="text-[10px] text-purple-500 font-bold">✦ {c.loyaltyPoints} pts</p>
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
                <div className="w-10 h-10 rounded-lg bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-lg shrink-0">👟</div>
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
              <p className="text-4xl mb-3 opacity-20">🛒</p>
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
            <button onClick={() => setShowCheckout(true)} className="btn-primary w-full justify-center py-3 text-sm shadow-lg shadow-brand-500/30">
              Checkout — {fmt(total)} →
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
                <button onClick={() => setSizeModal(null)} className="text-surface-400 hover:text-surface-600 text-xl">×</button>
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
              <button onClick={printReceipt} className="btn-primary flex-1 justify-center">⬇ PDF Receipt</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
