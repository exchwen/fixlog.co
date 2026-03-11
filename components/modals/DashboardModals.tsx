// dashboardmodal.tsx
'use client';

import React from 'react';

// 1. İş ve Görev Modalları
import JobDetailModal from './jobs/JobDetailModal';
import AddJobModal from './jobs/AddJobModal';
import ThermalPrintModal from './jobs/ThermalPrintModal'; 

// 2. Profil ve Detay Modalları
import CustomerDetailModal from './profiles/CustomerDetailModal';
import AssetDetailModal from './profiles/AssetDetailModal';
import StaffDetailModal from './profiles/StaffDetailModal';

// 3. Yeni Kayıt Ekleme Formları
import AddStaffModal from './forms/AddStaffModal';
import AddCustomerModal from './forms/AddCustomerModal';
import AddAssetModal from './forms/AddAssetModal';
import SmartExcelModal from './forms/SmartExcelModal';

// 4. Stok, Tedarikçi, Ayarlar ve SİPARİŞLER
import StockModal from './inventory/StockModal';
import StockEntryModal from './inventory/StockEntryModal'; // 🚀 YENİ EKLENDİ
import SupplierModals from './inventory/SupplierModals';
import CategoryModal from './inventory/CategoryModal';
import OrderModals from './inventory/OrderModals';

export default function DashboardModals(props: any) {
  return (
    <>
      {/* İŞ VE GÖREV MODALLARI */}
      <JobDetailModal {...props} />
      <AddJobModal {...props} />
      
      <ThermalPrintModal 
        isOpen={props.showThermalPrintModal} 
        onClose={() => props.setShowThermalPrintModal(false)} 
        job={props.selectedThermalJob} 
        companyName={props.data?.name || 'İşletme'} 
        companyLogo={props.data?.logo}
        assets={props.data?.assets}
      />

      {/* PROFİL VE DETAY MODALLARI */}
      <CustomerDetailModal {...props} />
      <AssetDetailModal {...props} />
      <StaffDetailModal {...props} />

      {/* YENİ KAYIT EKLEME FORMLARI */}
      <AddStaffModal {...props} />
      <AddCustomerModal {...props} />
      <AddAssetModal {...props} />
      <SmartExcelModal {...props} /> {/* 🚀 AKILLI EXCEL RENDER EDİLİYOR */}

      {/* STOK, TEDARİKÇİ, KATEGORİ VE SİPARİŞ MODALLARI */}
      <StockModal {...props} />
      <StockEntryModal {...props} /> {/* 🚀 YENİ EKLENDİ */}
      <SupplierModals {...props} />
      <CategoryModal {...props} />
      <OrderModals {...props} />
    </>
  );
}