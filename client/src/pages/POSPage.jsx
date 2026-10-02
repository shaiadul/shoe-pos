import { useState, useEffect, useMemo, useRef } from 'react';
import { productAPI, customerAPI, orderAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  POSHeader, 
  ProductGrid, 
  VariantSelectorModal, 
  CustomerSelectorModal, 
  POSCart, 
  CheckoutModal, 
  POSReceiptModal, 
  HeldCartsModal 
} from '../components/POS';
import { playBarcodeBeep, playSuccessChime, playErrorBeep } from '../utils/sound';

export default function POSPage() {
  const { settings, fmt } = useSettings();
  const { user } = useAuth();

  const searchRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Products state
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

  // Variant Modal
  const [variantModalData, setVariantModalData] = useState(null);

  // Held carts state
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_held_carts') || '[]');
    } catch {
      return [];
    }
  });
  const [showRecallModal, setShowRecallModal] = useState(false);

  // Customer state
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Discount state
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderDiscountType, setOrderDiscountType] = useState('percent'); // 'percent' | 'fixed'

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashPaid, setCashPaid] = useState('');
  const [partialPaid, setPartialPaid] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);

  // Receipt state
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // 1. Initial product loading
  useEffect(() => {
    loadProducts(1, '', '');
  }, []);

  const loadProducts = async (pg, srch, cat) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const r = await productAPI.getAll({ page: pg, limit: 25, search: srch, category: cat });
      setProducts((prev) => (pg === 1 ? r.data.products : [...prev, ...r.data.products]));
      setHasMore(pg < r.data.pages);
      setPage(pg);
    } catch {
      toast.error('Failed to load shoes from database');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounced search & category trigger
  useEffect(() => {
    const t = setTimeout(() => {
      loadProducts(1, search, selectedCategory);
    }, 280);
    return () => clearTimeout(t);
  }, [search, selectedCategory]);

  // Load category list
  useEffect(() => {
    productAPI
      .getCategories()
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  // Customer search debouncing
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await customerAPI.search(customerSearch);
        setCustomerResults(r.data.customers || []);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // 2. Barcode Scanner Handler
  const handleBarcodeScan = async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    try {
      const res = await productAPI.getByBarcode(trimmed);
      if (res.data?.product && res.data?.matchedVariant) {
        addToCart(res.data.product, res.data.matchedVariant);
        playBarcodeBeep();
        setBarcodeInput('');
      } else {
        playErrorBeep();
        toast.error(`Barcode not found: ${trimmed}`);
      }
    } catch {
      playErrorBeep();
      toast.error(`No item found for barcode: ${trimmed}`);
    }
  };

  // 3. Product Selection (Single-variant auto-add or variant picker)
  const handleSelectProduct = (product) => {
    const availableVariants = product.variants?.filter((v) => v.stock > 0) || [];
    if (availableVariants.length === 1) {
      // Direct instant add to cart!
      addToCart(product, availableVariants[0]);
    } else {
      // Group variants by size
      const grouped = {};
      product.variants.forEach((v) => {
        if (!grouped[v.size]) grouped[v.size] = [];
        grouped[v.size].push(v);
      });
      setVariantModalData({ product, sizes: grouped });
    }
  };

  // 4. Cart Operations
  const addToCart = (product, variant) => {
    const key = `${product._id}-${variant.size}-${variant.color}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          playErrorBeep();
          toast.error(`Only ${variant.stock} pair(s) in stock for size ${variant.size}`);
          return prev;
        }
        playBarcodeBeep();
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      if (variant.stock <= 0) {
        playErrorBeep();
        toast.error(`Size ${variant.size} is out of stock`);
        return prev;
      }
      playBarcodeBeep();
      return [
        ...prev,
        {
          key,
          productId: product._id,
          name: product.name,
          brand: product.brand,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          price: product.price,
          discount: product.discount || 0,
          stock: variant.stock,
          image: product.images?.[0] || '',
          quantity: 1,
        },
      ];
    });

    toast.success(`Added ${product.name} (Sz ${variant.size})`, { duration: 1200 });
    setVariantModalData(null);
  };

  const handleUpdateQty = (key, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.key !== key) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.stock) {
            playErrorBeep();
            toast.error(`Only ${item.stock} in stock`);
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (key) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  };

  const handleClearCart = () => {
    setCart([]);
    setCustomer(null);
    setOrderDiscount(0);
    setOrderDiscountType('percent');
    setCashPaid('');
    setPartialPaid('');
  };

  // 5. Hold and Recall Carts
  const handleHoldCart = () => {
    if (!cart.length) return toast.error('Cart is empty');
    const newHold = {
      id: Date.now().toString(),
      cart: [...cart],
      customer,
      orderDiscount,
      orderDiscountType,
      total,
      itemsCount: cart.reduce((s, i) => s + i.quantity, 0),
      timestamp: new Date().toISOString(),
      customerName: customer?.name || 'Walk-in Customer',
    };
    const updated = [newHold, ...heldCarts];
    setHeldCarts(updated);
    localStorage.setItem('pos_held_carts', JSON.stringify(updated));
    handleClearCart();
    toast.success('Cart parked on hold');
  };

  const handleRecallCart = (held) => {
    setCart(held.cart || []);
    setCustomer(held.customer || null);
    setOrderDiscount(held.orderDiscount || 0);
    setOrderDiscountType(held.orderDiscountType || 'percent');
    const updated = heldCarts.filter((c) => c.id !== held.id);
    setHeldCarts(updated);
    localStorage.setItem('pos_held_carts', JSON.stringify(updated));
    setShowRecallModal(false);
    toast.success(`Restored cart (${held.customerName})`);
  };

  const handleDeleteHeldCart = (id) => {
    const updated = heldCarts.filter((c) => c.id !== id);
    setHeldCarts(updated);
    localStorage.setItem('pos_held_carts', JSON.stringify(updated));
    toast.success('Parked cart removed');
  };

  // 6. Quick Add Customer
  const handleAddNewCustomer = async (formData, onSuccess) => {
    if (!formData.name?.trim()) return toast.error('Customer name is required');
    setSavingCustomer(true);
    try {
      const r = await customerAPI.create(formData);
      setCustomer(r.data.customer);
      setShowCustomerModal(false);
      onSuccess?.();
      toast.success(`Customer "${r.data.customer.name}" created and selected!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  // 7. Calculations
  const { subtotal, discountAmt, afterDiscount, taxAmt, total, cashChange, partialDue, effectivePaid, dueAmount } =
    useMemo(() => {
      const sub = cart.reduce(
        (s, i) => s + i.price * i.quantity * (1 - (i.discount || 0) / 100),
        0
      );

      // Order discount calculation (% or flat)
      let disc = 0;
      if (orderDiscountType === 'percent') {
        disc = (sub * Math.min(100, Math.max(0, orderDiscount))) / 100;
      } else {
        disc = Math.min(sub, Math.max(0, orderDiscount));
      }

      const after = Math.max(0, sub - disc);
      const tax = (after * (settings.taxRate || 0)) / 100;
      const tot = after + tax;

      const change = paymentMethod === 'cash' ? (parseFloat(cashPaid) || 0) - tot : 0;
      const pDue = paymentMethod === 'partial' ? tot - (parseFloat(partialPaid) || 0) : 0;
      const effPaid =
        paymentMethod === 'due'
          ? 0
          : paymentMethod === 'partial'
          ? parseFloat(partialPaid) || 0
          : paymentMethod === 'cash'
          ? Math.min(parseFloat(cashPaid) || tot, tot)
          : tot;
      const due = Math.max(0, tot - effPaid);

      return {
        subtotal: sub,
        discountAmt: disc,
        afterDiscount: after,
        taxAmt: tax,
        total: tot,
        cashChange: change,
        partialDue: pDue,
        effectivePaid: effPaid,
        dueAmount: due,
      };
    }, [
      cart,
      orderDiscount,
      orderDiscountType,
      settings.taxRate,
      paymentMethod,
      cashPaid,
      partialPaid,
    ]);

  // Checkout Validation
  const needsCustomer = ['due', 'partial'].includes(paymentMethod) || settings.requireCustomer;
  const canCheckout =
    cart.length > 0 &&
    (!needsCustomer || customer) &&
    (paymentMethod !== 'cash' || !cashPaid || parseFloat(cashPaid) >= total) &&
    (paymentMethod !== 'partial' ||
      (parseFloat(partialPaid) > 0 && parseFloat(partialPaid) < total));

  // 8. Order Submission
  const handleConfirmCheckout = async () => {
    if (!cart.length) return toast.error('Cart is empty');
    if (needsCustomer && !customer) {
      return toast.error('Please select a customer for this payment type');
    }

    setProcessingOrder(true);
    try {
      const items = cart.map((i) => ({
        product: i.productId,
        name: i.name,
        brand: i.brand,
        size: i.size,
        color: i.color,
        sku: i.sku,
        price: i.price,
        discount: i.discount || 0,
        quantity: i.quantity,
        total: i.price * i.quantity * (1 - (i.discount || 0) / 100),
      }));

      const r = await orderAPI.create({
        items,
        customer: customer?._id,
        customerName: customer?.name || 'Walk-in Customer',
        subtotal,
        discountAmount: discountAmt,
        taxAmount: taxAmt,
        taxRate: settings.taxRate || 0,
        taxName: settings.taxName || 'VAT',
        total,
        paidAmount: effectivePaid,
        paymentMethod,
        paymentDetails: {
          cashPaid: paymentMethod === 'cash' ? parseFloat(cashPaid) || total : effectivePaid,
          change: Math.max(0, cashChange),
          dueNote:
            paymentMethod === 'due'
              ? 'Full due sale'
              : paymentMethod === 'partial'
              ? `Partial: paid ${fmt(effectivePaid)}, due ${fmt(dueAmount)}`
              : '',
        },
      });

      const savedOrder = r.data.order;
      setCompletedOrder(savedOrder);
      setShowCheckout(false);
      setShowReceipt(true);
      playSuccessChime();
      handleClearCart();
      toast.success('Sale successfully completed! 🎉');

      if (settings.autoPrintReceipt) {
        setTimeout(() => {
          window.print();
        }, 350);
      }
    } catch (err) {
      playErrorBeep();
      toast.error(err.response?.data?.message || 'Failed to complete order');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Start new sale after receipt
  const handleNewSale = () => {
    setShowReceipt(false);
    setCompletedOrder(null);
    handleClearCart();
    setTimeout(() => {
      searchRef.current?.focus?.();
    }, 150);
  };

  // 9. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus?.();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !showCheckout && !showReceipt) {
          setShowCheckout(true);
        }
      } else if (e.key === 'Escape') {
        setShowCheckout(false);
        setVariantModalData(null);
        setShowRecallModal(false);
        setShowCustomerModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, showCheckout, showReceipt]);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Left Main Section: Catalog, Search, and Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <POSHeader
          search={search}
          setSearch={setSearch}
          barcodeInput={barcodeInput}
          setBarcodeInput={setBarcodeInput}
          onBarcodeScan={handleBarcodeScan}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          heldCartsCount={heldCarts.length}
          onOpenHeldCarts={() => setShowRecallModal(true)}
          searchRef={searchRef}
          barcodeInputRef={barcodeInputRef}
        />

        <ProductGrid
          products={products}
          loading={loading}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => loadProducts(page + 1, search, selectedCategory)}
          onSelectProduct={handleSelectProduct}
          fmt={fmt}
          search={search}
          onResetFilters={() => {
            setSearch('');
            setSelectedCategory('');
          }}
        />
      </div>

      {/* Right Section: Modular Cart and Totals */}
      <POSCart
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onHoldCart={handleHoldCart}
        customer={customer}
        onOpenCustomerModal={() => setShowCustomerModal(true)}
        orderDiscount={orderDiscount}
        setOrderDiscount={setOrderDiscount}
        orderDiscountType={orderDiscountType}
        setOrderDiscountType={setOrderDiscountType}
        subtotal={subtotal}
        discountAmt={discountAmt}
        taxAmt={taxAmt}
        total={total}
        taxRate={settings.taxRate}
        taxName={settings.taxName}
        fmt={fmt}
        onOpenCheckout={() => setShowCheckout(true)}
      />

      {/* Modals */}
      {/* 1. Shoe Variant (Size/Color) Selector */}
      <VariantSelectorModal
        modalData={variantModalData}
        onClose={() => setVariantModalData(null)}
        onAddToCart={addToCart}
        fmt={fmt}
      />

      {/* 2. Customer Selector & Quick Add */}
      <CustomerSelectorModal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customer={customer}
        onSelectCustomer={(c) => {
          setCustomer(c);
          setShowCustomerModal(false);
          setCustomerSearch('');
        }}
        onRemoveCustomer={() => {
          setCustomer(null);
          setShowCustomerModal(false);
        }}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
        customerResults={customerResults}
        onAddNewCustomer={handleAddNewCustomer}
        savingCustomer={savingCustomer}
        fmt={fmt}
      />

      {/* 3. Checkout Modal */}
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        total={total}
        cart={cart}
        customer={customer}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cashPaid={cashPaid}
        setCashPaid={setCashPaid}
        partialPaid={partialPaid}
        setPartialPaid={setPartialPaid}
        cashChange={cashChange}
        partialDue={partialDue}
        processingOrder={processingOrder}
        onConfirmCheckout={handleConfirmCheckout}
        canCheckout={canCheckout}
        fmt={fmt}
      />

      {/* 4. Thermal POS Slip / Receipt Modal (With Pixel-Perfect Alignment) */}
      <POSReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={completedOrder}
        settings={settings}
        onNewSale={handleNewSale}
      />

      {/* 5. Parked & Held Carts Modal */}
      <HeldCartsModal
        open={showRecallModal}
        onClose={() => setShowRecallModal(false)}
        heldCarts={heldCarts}
        onRecallCart={handleRecallCart}
        onDeleteHeldCart={handleDeleteHeldCart}
        fmt={fmt}
      />
    </div>
  );
}
