'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, AlertTriangle, Package, Phone, Tag, Truck, Tags, ShoppingCart, Send, ArrowRight, CheckCircle2, ExternalLink, ArrowLeft, AlertCircle, Info, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StockTab({ data, handleAction, setShowStockModal, setShowSupplierModal, setShowSupplierListModal, setShowCategoryModal, setShowStockEntryModal }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Satır içi düzenleme state'i
  const [editingStock, setEditingStock] = useState<any>(null);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  // SİPARİŞ MODALI STATE'LERİ
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderMode, setOrderMode] = useState<'SINGLE' | 'BULK'>('SINGLE'); // SİPARİŞ MODU SEÇİMİ
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState<any>(null); // TEKİL SİPARİŞ İÇİN SEÇİLEN TEDARİKÇİ
  const [orderQuantities, setOrderQuantities] = useState<{[key: string]: string}>({});
  const [orderStep, setOrderStep] = useState<'INPUT' | 'SENDING'>('INPUT'); // INPUT: Adet Girişi, SENDING: Gönderim Ekranı
  const [sentSuppliers, setSentSuppliers] = useState<string[]>([]); // Hangi tedarikçilere gönderildiğini takip etmek için

  // 🚀 Yeni Alert ve Confirm State'leri
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; idToDelete: string | null; itemName: string }>({ isOpen: false, idToDelete: null, itemName: '' });

  const rawStock = data?.stock || [];
  const suppliers = data?.suppliers || [];
  const categories = data?.categories || [];
  const companyName = data?.name || 'Firmamız'; 

  // Kritik Stokları (Miktarı 5 ve altı olanları) bul (Tüm stoklar üzerinden hesaplanır)
  const criticalStocks = useMemo(() => {
    return rawStock.filter((item: any) => Number(item.quantity) <= 5);
  }, [rawStock]);

  // Sadece Arama Filtresini Uygula (Kategori filtresi kaldırıldı)
  const filteredStock = rawStock.filter((item: any) => {
    const supplier = suppliers.find((s:any) => s.id === item.supplier_id);
    const supplierName = supplier ? supplier.name : (item.supplier_name || '');
    
    return item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.category?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Kritik stoğu olan tedarikçileri grupla
  const suppliersWithCriticalStock = useMemo(() => {
    const supplierMap = new Map();
    
    criticalStocks.forEach((item: any) => {
        if (item.supplier_id) {
            const supplier = suppliers.find((s:any) => s.id === item.supplier_id);
            if (supplier && !supplierMap.has(supplier.id)) {
                supplierMap.set(supplier.id, { ...supplier, items: [] });
            }
            if (supplierMap.has(supplier.id)) {
                supplierMap.get(supplier.id).items.push(item);
            }
        }
    });
    return Array.from(supplierMap.values());
  }, [criticalStocks, suppliers]);

  // SADECE GÖNDERİM YAPILACAK TEDARİKÇİLERİ FİLTRELE (Adet girilmiş olanlar - TOPLU MOD İÇİN)
  const suppliersToProcess = useMemo(() => {
    return suppliersWithCriticalStock.filter(supplier => {
        return supplier.items.some((item: any) => orderQuantities[item.id] && Number(orderQuantities[item.id]) > 0);
    });
  }, [suppliersWithCriticalStock, orderQuantities]);

  const handleUpdate = async () => {
    setIsSavingLocal(true);
    await handleAction('update-stock', { 
        id: editingStock.id, 
        itemName: editingStock.itemName, 
        quantity: editingStock.quantity, 
        unitName: editingStock.unitName, 
        unitPrice: editingStock.unitPrice, 
        category: editingStock.category || '', 
        supplierId: editingStock.supplierId || null,
        minAlert: editingStock.minAlert || 5
    }, () => setEditingStock(null), null);
    setIsSavingLocal(false);
  };

  const handleDelete = async (id: string, itemName: string) => {
    setConfirmModal({ isOpen: true, idToDelete: id, itemName: itemName });
 };

 const confirmDelete = async () => {
   if (confirmModal.idToDelete) {
     await handleAction('delete-stock', { id: confirmModal.idToDelete }, null, null);
     setConfirmModal({ isOpen: false, idToDelete: null, itemName: '' });
   }
 };

 // TEKİL SİPARİŞ GÖNDERME (TEK BUTON)
 const sendSingleOrder = () => {
   if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setAlertModal({ isOpen: true, message: "WhatsApp üzerinden sipariş geçebilmek için internet bağlantısına ihtiyacınız var.", type: 'warning' });
      return;
   }

   if (!selectedSupplierForOrder) return;

   const itemsToOrder = selectedSupplierForOrder.items.filter((item:any) => orderQuantities[item.id] && Number(orderQuantities[item.id]) > 0);

   if (itemsToOrder.length === 0) {
       setAlertModal({ isOpen: true, message: "Lütfen en az bir ürün için adet giriniz.", type: 'warning' });
       return;
   }

   let messageText = `Merhaba, ${companyName} firmasından sipariş geçmek istiyoruz.\n`;
    messageText += `Aşağıdaki ürünlerin temini rica olunur:\n\n`;
    
    itemsToOrder.forEach((item: any) => {
        const qty = orderQuantities[item.id];
        messageText += `- ${item.item_name}: *${qty} ${item.unit_name}*\n`;
    });

    if (data?.address) {
        messageText += `\nTeslimat Adresi:\n${data.address}\n`;
    }

    messageText += `\nİyi çalışmalar.`;

    let phone = selectedSupplierForOrder.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10 && phone.startsWith('5')) {
        phone = '90' + phone;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    
    // Temizlik
    setOrderQuantities({});
    setShowOrderModal(false);
    setSelectedSupplierForOrder(null);
  };

// TOPLU SİPARİŞ İÇİN WHATSAPP LİNKİ OLUŞTURMA VE AÇMA
const openWhatsappForSupplier = (supplier: any) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
     setAlertModal({ isOpen: true, message: "WhatsApp üzerinden sipariş geçebilmek için internet bağlantısına ihtiyacınız var.", type: 'warning' });
     return;
  }

  const itemsToOrder = supplier.items.filter((item:any) => orderQuantities[item.id] && Number(orderQuantities[item.id]) > 0);
  if (itemsToOrder.length === 0) return;

  let messageText = `Merhaba, ${companyName} firmasından sipariş geçmek istiyoruz.\n`;
  messageText += `Aşağıdaki ürünlerin temini rica olunur:\n\n`;
  
  itemsToOrder.forEach((item: any) => {
      const qty = orderQuantities[item.id];
      messageText += `- ${item.item_name}: *${qty} ${item.unit_name}*\n`;
  });

  if (data?.address) {
      messageText += `\nTeslimat Adresi:\n${data.address}\n`;
  }

  messageText += `\nİyi çalışmalar.`;

  let phone = supplier.phone.replace(/[^0-9]/g, '');
  if (phone.length === 10 && phone.startsWith('5')) {
      phone = '90' + phone;
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
  window.open(url, '_blank');

  if (!sentSuppliers.includes(supplier.id)) {
      setSentSuppliers(prev => [...prev, supplier.id]);
  }
};

  const handleCloseOrderModal = () => {
    setShowOrderModal(false); 
    setOrderQuantities({}); 
    setOrderStep('INPUT'); 
    setSentSuppliers([]);
    setSelectedSupplierForOrder(null);
  };

  // 🚀 AKILLI POPSTATE VE ESC YÖNETİMİ
  const handleSmartClose = React.useCallback((e?: any) => {
    const stopEvent = () => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
          e.nativeEvent.stopImmediatePropagation();
        }
      }
    };

    // Önce Sipariş modalını kapatmayı deneriz
    if (showOrderModal) {
        stopEvent();
        handleCloseOrderModal();
        return true;
    }

    // Sonra Düzenleme modalını kapatmayı deneriz
    if (editingStock) {
        stopEvent();
        setEditingStock(null);
        return true;
    }

    return false;
  }, [showOrderModal, editingStock]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSmartClose(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleSmartClose]);

  React.useEffect(() => {
    if (showOrderModal || editingStock) {
        window.history.pushState({ internalStockLayer: true }, '');
    }
  }, [showOrderModal, editingStock]);

  React.useEffect(() => {
    if (!showOrderModal && !editingStock) return;
    const handlePopState = (e: PopStateEvent) => {
      handleSmartClose(e);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showOrderModal, editingStock, handleSmartClose]);

  return (
    <div className="space-y-6 relative pb-10 sm:pb-0">
      
       {/* 1. KRİTİK STOK UYARI KUTUSU */}
       <AnimatePresence>
         {criticalStocks.length > 0 && (
           <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden"
           >
              <div className="hidden sm:flex absolute top-5 right-5 z-20 items-center gap-2">
                <button 
                    onClick={() => { setOrderMode('SINGLE'); setShowOrderModal(true); }}
                    className="bg-white text-amber-600 border border-amber-200 hover:bg-amber-100 px-3 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                    <Package size={16} />
                    Sipariş Oluştur
                </button>

                <button 
                    onClick={() => { setOrderMode('BULK'); setShowOrderModal(true); }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all active:scale-95"
                >
                    <ShoppingCart size={16} />
                    Toplu Sipariş Oluştur
                </button>
              </div>

              <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
                <AlertTriangle size={150} className="text-amber-500 translate-x-4 -translate-y-4" />
              </div>

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-8 sm:h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-sm border border-amber-200 shrink-0">
                      <AlertTriangle size={20} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-sm font-black text-amber-900 tracking-tight">Kritik Stok Uyarısı</h3>
                      <p className="text-[11px] font-medium text-amber-700">Tükenmek üzere olan <span className="font-bold underline">{criticalStocks.length} parça</span> tespit edildi. Acil sipariş geçmeniz önerilir.</p>
                    </div>
                  </div>
                  
                  <div className="flex sm:hidden items-center gap-2 mt-2">
                    <button 
                        onClick={() => { setOrderMode('SINGLE'); setShowOrderModal(true); }}
                        className="flex-1 bg-white text-amber-600 border border-amber-200 px-3 py-2.5 rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Package size={14} /> Sipariş
                    </button>

                    <button 
                        onClick={() => { setOrderMode('BULK'); setShowOrderModal(true); }}
                        className="flex-[2] bg-amber-600 text-white px-3 py-2.5 rounded-lg text-xs font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <ShoppingCart size={14} /> Toplu Sipariş
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                  {criticalStocks.map((item: any) => {
                    const supplier = suppliers.find((s:any) => s.id === item.supplier_id);
                    const supName = supplier ? supplier.name : (item.supplier_name || 'Tedarikçi Yok');

                    return (
                      <div key={item.id} className="bg-white/90 backdrop-blur-sm border border-amber-200/60 rounded-xl p-3 sm:p-3 flex flex-col justify-between shadow-sm relative group hover:border-amber-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-2 overflow-hidden pr-2">
                            <Package size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                              {item.item_name}
                            </div>
                          </div>
                          <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-xs font-black shrink-0 border border-amber-200/50 shadow-sm">
                            {item.quantity} <span className="text-[9px] font-bold uppercase">{item.unit_name}</span>
                          </div>
                        </div>

                        <div className="mt-auto pt-2 border-t border-amber-100/50">
                          <div className="text-[10px] text-slate-500 font-bold uppercase truncate">
                            {supName}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* 2. ANA LİSTE BAŞLIĞI, ARAMA VE BUTON KUTUSU */}
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
         <div className="w-full xl:w-auto">
           <h3 className="text-lg font-black text-slate-900 tracking-tight">Tüm Envanter & Parçalar</h3>
           <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Stoktaki tüm malzemelerinizi yönetin ve yeni stok girişi yapın.</p>
         </div>
         <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 w-full xl:w-auto">
           
           {/* Arama Kutusu */}
           <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Parça, Kategori veya Tedarikçi Ara..." 
               className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 hover:bg-white transition-all placeholder:text-slate-400"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           
           {/* Aksiyon Butonları */}
           <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-2">
             <button onClick={() => setShowCategoryModal(true)} className="bg-slate-100 text-slate-700 px-3 sm:px-3 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-200 whitespace-nowrap transition-all active:scale-95 border border-slate-200">
               <Tags size={14} /> Kategoriler
             </button>
             <button onClick={() => setShowSupplierListModal(true)} className="bg-slate-100 text-slate-700 px-3 sm:px-3 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-200 whitespace-nowrap transition-all active:scale-95 border border-slate-200">
               <Truck size={14} /> Tedarikçiler
             </button>
             
             {/* 🚀 YENİ: Stok Girişi Yap Butonu */}
             <button onClick={() => setShowStockEntryModal(true)} className="col-span-2 bg-emerald-600 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 hover:bg-emerald-700 whitespace-nowrap transition-all active:scale-95 border border-emerald-700">
               <Archive size={16} /> Stok Girişi
             </button>

             <button onClick={() => setShowStockModal(true)} className="col-span-2 sm:col-span-1 bg-slate-900 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-slate-200 hover:bg-slate-800 whitespace-nowrap transition-all active:scale-95 border border-slate-900">
               <Plus size={16} /> Yeni Tanım
             </button>
           </div>
         </div>
       </div>

       {/* 3. MASAÜSTÜ TABLO GÖRÜNÜMÜ */}
       <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
         <table className="w-full text-left text-xs min-w-[700px]">
           <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">Parça Adı</th>
                <th className="px-5 py-4 whitespace-nowrap">Kategori</th>
                <th className="px-5 py-4 whitespace-nowrap">Miktar / Birim</th>
                <th className="px-5 py-4 whitespace-nowrap">Birim Fiyatı</th>
                <th className="px-5 py-4 whitespace-nowrap">Tedarikçi Firma</th>
                <th className="px-5 py-4 text-right whitespace-nowrap">İşlemler</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {filteredStock.length > 0 ? filteredStock.map((item: any) => {
                const isCritical = Number(item.quantity) <= 5;
                const supplier = suppliers.find((s:any) => s.id === item.supplier_id);
                const supName = supplier ? supplier.name : (item.supplier_name || 'Tedarikçi Yok');
                const supPhone = supplier ? supplier.phone : item.supplier_phone;
                
                return (
                  <tr key={item.id} className={`transition-colors ${isCritical ? 'bg-amber-50/30 hover:bg-amber-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-5 py-4 align-middle">
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {isCritical && <AlertTriangle size={14} className="text-amber-500" />}
                        {item.item_name}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      {item.category ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200 whitespace-nowrap">
                          <Tag size={12} /> {item.category}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic font-medium whitespace-nowrap">Kategorisiz</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle whitespace-nowrap">
                       <span className={`font-black text-base ${isCritical ? 'text-amber-600' : 'text-blue-600'}`}>
                         {item.quantity}
                       </span> 
                       <span className="text-slate-500 ml-1 font-bold text-[10px] uppercase">
                         {item.unit_name}
                       </span>
                    </td>
                    <td className="px-5 py-4 align-middle text-emerald-600 font-black whitespace-nowrap">₺{item.unit_price || '0'}</td>
                    <td className="px-5 py-4 align-middle">
                       <div className="font-bold text-slate-700 whitespace-nowrap">{supName}</div>
                       <div className="text-[10px] text-slate-400 font-semibold mt-0.5 whitespace-nowrap">{supPhone || 'Telefon Kaydı Yok'}</div>
                    </td>
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                            onClick={() => setEditingStock({ id: item.id, itemName: item.item_name, quantity: item.quantity, unitName: item.unit_name, unitPrice: item.unit_price, category: item.category || '', supplierId: item.supplier_id || '', minAlert: item.min_alert || 5 })} 
                            className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg transition-all active:scale-95 shadow-sm"
                            title="Düzenle"
                         >
                            <Edit2 size={16} />
                         </button>
                         <button
                            onClick={() => handleDelete(item.id, item.item_name)} 
                            className="p-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-lg transition-all active:scale-95 shadow-sm"
                            title="Sil"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                )
              }) : <tr><td colSpan={6} className="p-16 text-center text-slate-400 font-medium bg-slate-50/50">Aradığınız kriterde stok bulunamadı.</td></tr>}
           </tbody>
         </table>
       </div>

       {/* 3.1 MOBİL GÖRÜNÜM: DİKEY STOK KARTLARI */}
       <div className="md:hidden flex flex-col gap-3">
         {filteredStock.length > 0 ? filteredStock.map((item: any) => {
            const isCritical = Number(item.quantity) <= 5;
            const supplier = suppliers.find((s:any) => s.id === item.supplier_id);
            const supName = supplier ? supplier.name : (item.supplier_name || 'Tedarikçi Yok');

            return (
              <div key={item.id} className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col gap-3 ${isCritical ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200'}`}>
                
                {/* Başlık ve Miktar */}
                <div className="flex justify-between items-start gap-2">
                  <div className="font-black text-slate-800 text-sm flex items-start gap-2 line-clamp-2">
                    {isCritical ? <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> : <Package size={16} className="text-blue-500 shrink-0 mt-0.5" />}
                    <span>{item.item_name}</span>
                  </div>
                  <div className={`shrink-0 px-2.5 py-1.5 rounded-lg border font-black text-sm flex flex-col items-center leading-none ${isCritical ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-blue-700 border-slate-200'}`}>
                    {item.quantity}
                    <span className="text-[8px] font-bold uppercase mt-0.5">{item.unit_name}</span>
                  </div>
                </div>

                {/* Kategori ve Fiyat */}
                <div className="flex items-center gap-2">
                  {item.category ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                      <Tag size={10} /> {item.category}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px] italic font-medium">Kategorisiz</span>
                  )}
                  <span className="text-emerald-600 font-black text-xs px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100">₺{item.unit_price || '0'}</span>
                </div>

                {/* Tedarikçi ve Aksiyonlar (Alt Kısım) */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 truncate pr-2">
                    <Truck size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{supName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                     <button 
                        onClick={() => setEditingStock({ id: item.id, itemName: item.item_name, quantity: item.quantity, unitName: item.unit_name, unitPrice: item.unit_price, category: item.category || '', supplierId: item.supplier_id || '', minAlert: item.min_alert || 5 })} 
                        className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg transition-all active:scale-95"
                     >
                       <Edit2 size={14} />
                     </button>
                     <button
                        onClick={() => handleDelete(item.id, item.item_name)} 
                        className="p-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-lg transition-all active:scale-95"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
                </div>

              </div>
            );
         }) : (
           <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
              <Package size={32} className="text-slate-300" />
              <span className="text-slate-500 font-medium text-sm">Aradığınız kriterde stok bulunamadı.</span>
           </div>
         )}
       </div>


       {/* 4. SİPARİŞ MODALI (TEKİL VE TOPLU MODLARI) */}
       <AnimatePresence>
         {showOrderModal && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 cursor-pointer" onClick={(e) => handleSmartClose(e)}></div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative border border-slate-200 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${orderStep === 'INPUT' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                            {orderStep === 'INPUT' ? <ShoppingCart size={20} /> : <CheckCircle2 size={20} />}
                        </div>
                        <div className="min-w-0 pr-2">
                            {/* DİNAMİK BAŞLIK: TEKİL SİPARİŞTE TEDARİKÇİ ADI, TOPLUDA GENEL BAŞLIK */}
                            <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight truncate">
                                {orderMode === 'SINGLE' 
                                    ? (selectedSupplierForOrder ? selectedSupplierForOrder.name : 'Tedarikçi Seçimi') 
                                    : (orderStep === 'INPUT' ? 'Toplu Sipariş Oluştur' : 'Siparişler Gönderiliyor')
                                }
                            </h2>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                                {orderMode === 'SINGLE' 
                                    ? (selectedSupplierForOrder ? 'Tedarik edilecek ürünlerin adetlerini girin.' : 'Sipariş verilecek tedarikçiyi seçin.')
                                    : (orderStep === 'INPUT' ? 'Tedarikçilere göre kritik stok ürünleri listelenmiştir.' : 'Siparişleri sırasıyla WhatsApp üzerinden gönderin.')
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {/* TEKİL SİPARİŞTE GERİ BUTONU */}
                        {orderMode === 'SINGLE' && selectedSupplierForOrder && (
                            <button onClick={() => { setSelectedSupplierForOrder(null); setOrderQuantities({}); }} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors active:scale-95"><ArrowLeft size={20} /></button>
                        )}
                        <button onClick={handleCloseOrderModal} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors active:scale-95"><X size={20} /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1">
                    
                    {/* --- TEKİL SİPARİŞ MODU --- */}
                    {orderMode === 'SINGLE' && (
                        !selectedSupplierForOrder ? (
                            // ADIM 1: TEDARİKÇİ SEÇİM LİSTESİ
                            <div className="grid grid-cols-1 gap-3">
                                {suppliersWithCriticalStock.length > 0 ? suppliersWithCriticalStock.map((supplier: any) => (
                                    <button 
                                        key={supplier.id}
                                        onClick={() => setSelectedSupplierForOrder(supplier)}
                                        className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all active:scale-95 group text-left"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {supplier.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 pr-2">
                                                <div className="font-bold text-slate-800 truncate">{supplier.name}</div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 font-medium flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold">{supplier.items.length} Kritik Ürün</span>
                                                    {supplier.phone && <span className="flex items-center gap-1"><Phone size={10}/> {supplier.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0">
                                            <ArrowRight size={18} />
                                        </div>
                                    </button>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500 font-medium text-sm">Kayıtlı tedarikçisi olan kritik stok bulunamadı.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // ADIM 2: SEÇİLEN TEDARİKÇİ İÇİN ÜRÜN LİSTESİ
                            <div className="space-y-3">
                                {selectedSupplierForOrder.items.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm hidden sm:flex">
                                            <Package size={18} className="text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2">{item.item_name}</div>
                                            <div className="text-[10px] font-bold text-amber-600 mt-0.5">Mevcut: {item.quantity} {item.unit_name}</div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm shrink-0">
                                            <input 
                                                type="number" 
                                                placeholder="0"
                                                className="w-12 sm:w-16 py-1 text-center outline-none text-sm font-bold text-slate-800 bg-transparent"
                                                value={orderQuantities[item.id] || ''}
                                                onChange={(e) => setOrderQuantities({...orderQuantities, [item.id]: e.target.value})}
                                            />
                                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-1 rounded-md uppercase">{item.unit_name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* --- TOPLU SİPARİŞ MODU --- */}
                    {orderMode === 'BULK' && (
                         orderStep === 'INPUT' ? (
                            // ADIM 1: TÜM TEDARİKÇİLER VE ÜRÜNLER (ADET GİRİŞİ)
                            <div className="space-y-5">
                                {suppliersWithCriticalStock.length > 0 ? suppliersWithCriticalStock.map((supplier: any) => (
                                    <div key={supplier.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                                                    {supplier.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-slate-800 text-sm truncate">{supplier.name}</div>
                                            </div>
                                            <div className="text-[10px] bg-white border border-slate-200 px-2 py-1.5 rounded-md text-slate-500 font-bold flex items-center gap-1 shrink-0 shadow-sm">
                                                <Phone size={10} /> {supplier.phone || 'Tel Yok'}
                                            </div>
                                        </div>
                                        
                                        <div className="divide-y divide-slate-100">
                                            {supplier.items.map((item: any) => (
                                                <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2">{item.item_name}</div>
                                                        <div className="text-[10px] text-amber-600 font-bold mt-0.5">Kalan: {item.quantity} {item.unit_name}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 bg-slate-50 border border-slate-200 p-1 rounded-lg">
                                                        <input 
                                                            type="number" 
                                                            placeholder="0"
                                                            className="w-12 sm:w-16 h-8 text-center bg-white border border-slate-200 rounded-md text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                                            value={orderQuantities[item.id] || ''}
                                                            onChange={(e) => setOrderQuantities({...orderQuantities, [item.id]: e.target.value})}
                                                        />
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 w-8 sm:w-10 text-center uppercase">{item.unit_name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500 font-medium text-sm">Kayıtlı tedarikçisi olan kritik stok bulunamadı.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // ADIM 2: GÖNDERİM EKRANI (TOPLU MOD)
                            <div className="space-y-4">
                                {suppliersToProcess.length > 0 ? suppliersToProcess.map((supplier: any) => {
                                    const isSent = sentSuppliers.includes(supplier.id);
                                    return (
                                        <div key={supplier.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 sm:gap-0 transition-all ${isSent ? 'bg-green-50 border-green-200 opacity-70' : 'bg-white border-blue-200 shadow-md'}`}>
                                            <div>
                                                <div className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                                    {supplier.name}
                                                    {isSent && <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-black flex items-center gap-1"><CheckCircle2 size={10} /> GÖNDERİLDİ</span>}
                                                </div>
                                                <div className="text-[11px] font-medium text-slate-500 mt-1">
                                                    {supplier.items.filter((i:any) => orderQuantities[i.id] && Number(orderQuantities[i.id]) > 0).length} Kalem Ürün Sipariş Edilecek
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => openWhatsappForSupplier(supplier)}
                                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all active:scale-95 w-full sm:w-auto ${isSent ? 'bg-white border border-green-200 text-green-700' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20'}`}
                                            >
                                                {isSent ? 'Tekrar Gönder' : 'WhatsApp İle Gönder'}
                                                {!isSent && <ExternalLink size={14} />}
                                            </button>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-10 text-rose-500 font-bold">
                                        Lütfen en az bir ürüne adet giriniz.
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
                    {orderMode === 'SINGLE' ? (
                        selectedSupplierForOrder && (
                            <button 
                                onClick={sendSingleOrder}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Send size={18} />
                                WhatsApp İle Siparişi Gönder
                            </button>
                        )
                    ) : (
                        // TOPLU MOD FOOTER
                        orderStep === 'INPUT' ? (
                          <button 
                              onClick={() => {
                                  if(suppliersToProcess.length === 0) {
                                      setAlertModal({ isOpen: true, message: "Lütfen en az bir ürün için adet giriniz.", type: 'warning' });
                                      return;
                                  }
                                  setOrderStep('SENDING');
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                          >
                              Gönderimi Başlat <ArrowRight size={18} />
                          </button>
                      ) : (
                             <button 
                                onClick={handleCloseOrderModal}
                                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                İşlemi Tamamla ve Kapat
                            </button>
                        )
                    )}
                </div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* DÜZENLEME MODALI */}
       <AnimatePresence>
         {editingStock && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 cursor-pointer" onClick={(e) => handleSmartClose(e)}></div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl relative border border-slate-200">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 leading-none">Stok Kaydını Güncelle</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-1.5">Sistemdeki mevcut parça verisini değiştiriyorsunuz.</p>
                  </div>
                  <button onClick={(e) => handleSmartClose(e)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-colors active:scale-95"><X size={18} /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-blue-600 tracking-wider block mb-1.5">PARÇA ADI <span className="text-rose-500">*</span></label>
                    <input className="w-full px-4 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-bold outline-none focus:border-blue-400 focus:bg-white bg-slate-50 transition-all text-slate-800" value={editingStock.itemName} onChange={e => setEditingStock({...editingStock, itemName: e.target.value})} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 tracking-wider block mb-1.5">KATEGORİ (Opsiyonel)</label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-bold outline-none bg-slate-50 focus:bg-white focus:border-blue-400 transition-all text-slate-700" value={editingStock.category} onChange={e => setEditingStock({...editingStock, category: e.target.value})}>
                      <option value="">Kategori Seçin veya Boş Bırakın</option>
                      {categories.map((c:any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-500 tracking-wider block mb-1.5">MİKTAR <span className="text-rose-500">*</span></label>
                    <input type="number" min="0" className="w-full px-4 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-bold outline-none focus:border-blue-400 focus:bg-white bg-slate-50 transition-all text-slate-800" value={editingStock.quantity} onChange={e => setEditingStock({...editingStock, quantity: e.target.value})} />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-500 tracking-wider block mb-1.5">BİRİM</label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-bold outline-none bg-slate-50 focus:bg-white focus:border-blue-400 transition-all text-slate-700" value={editingStock.unitName} onChange={e => setEditingStock({...editingStock, unitName: e.target.value})}>
                      <option value="Adet">Adet</option>
                      <option value="Metre">Metre</option>
                      <option value="Paket">Paket</option>
                      <option value="Kutu">Kutu</option>
                      <option value="Litre">Litre</option>
                      <option value="Kg">Kg</option>
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-emerald-600 tracking-wider block mb-1.5">BİRİM FİYAT (₺)</label>
                    <input type="number" min="0" className="w-full px-4 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-black outline-none focus:border-emerald-400 focus:bg-white bg-slate-50 transition-all text-slate-800" value={editingStock.unitPrice} onChange={e => setEditingStock({...editingStock, unitPrice: e.target.value})} />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-amber-600 tracking-wider block mb-1.5 flex items-center gap-1">
                        <AlertTriangle size={12} /> UYARI EŞİĞİ
                    </label>
                    <div className="relative">
                        <input 
                            type="number" 
                            min="0"
                            className="w-full px-4 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-bold outline-none focus:border-amber-400 focus:bg-white bg-slate-50 transition-all text-slate-800" 
                            value={editingStock.minAlert || ''} 
                            placeholder="Örn: 5"
                            onChange={e => setEditingStock({...editingStock, minAlert: e.target.value})} 
                        />
                        <div className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 uppercase hidden sm:block">
                            ALTINA DÜŞÜNCE UYAR
                        </div>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2 mt-1 pt-3 border-t border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 tracking-wider block mb-1.5">TEDARİKÇİ BİLGİSİ</label>
                     <select className="w-full px-4 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-bold outline-none bg-slate-50 focus:bg-white focus:border-blue-400 transition-all text-slate-700" value={editingStock.supplierId} onChange={e => setEditingStock({...editingStock, supplierId: e.target.value})}>
                      <option value="">-- Bağımsız / Tedarikçi Seçilmedi --</option>
                      {suppliers.map((s:any) => (
                        <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                  <button 
                    disabled={isSavingLocal || !editingStock.itemName || editingStock.quantity === ''} 
                    className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 flex justify-center items-center shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50" 
                    onClick={handleUpdate}
                  >
                    {isSavingLocal ? <Loader2 className="animate-spin" size={18} /> : 'Kaydet'}
                  </button>
                  <button onClick={(e) => handleSmartClose(e)} className="flex-1 px-4 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95">
                    İptal
                  </button>
                </div>
                </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* 🚀 SİLME ONAY MODALI */}
       <AnimatePresence>
            {confirmModal.isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 10 }} 
                        animate={{ scale: 1, y: 0 }} 
                        exit={{ scale: 0.9, y: 10 }} 
                        className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-slate-200"
                    >
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Stoğu Sil</h3>
                        <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                            <strong className="text-slate-700 block mb-1">{confirmModal.itemName}</strong>
                            Adlı stok kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setConfirmModal({ isOpen: false, idToDelete: null, itemName: '' })}
                                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
                            >
                                İptal
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 bg-rose-600 text-white font-bold py-3.5 rounded-xl hover:bg-rose-700 transition-all active:scale-95 shadow-md shadow-rose-600/20"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* 🚀 DİNAMİK GENEL UYARI MODALI */}
        <AnimatePresence>
            {alertModal.isOpen && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
            >
                <motion.div 
                initial={{ scale: 0.9, y: 10 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 10 }} 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center border border-slate-200"
                >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${
                    alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                    alertModal.type === 'error' ? 'bg-rose-50 text-rose-500' : 
                    alertModal.type === 'warning' ? 'bg-amber-50 text-amber-500' : 
                    'bg-blue-50 text-blue-500'
                }`}>
                    {alertModal.type === 'success' && <CheckCircle2 size={32} />}
                    {alertModal.type === 'error' && <AlertCircle size={32} />}
                    {alertModal.type === 'warning' && <AlertTriangle size={32} />}
                    {alertModal.type === 'info' && <Info size={32} />}
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                    {alertModal.type === 'success' ? 'Başarılı!' : 
                    alertModal.type === 'error' ? 'Hata!' : 
                    alertModal.type === 'warning' ? 'Uyarı!' : 
                    'Bilgi'}
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                    {alertModal.message}
                </p>
                <button 
                    onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-md flex justify-center items-center"
                >
                    Tamam
                </button>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>

    </div>
  );
}