'use client';

import React, { useState } from 'react';

export default function DynamicJobForm({ sectorData, jobForm, setJobForm, isAdmin = true }) {
  const [selectedSubType, setSelectedSubType] = useState('');

  // Sektördeki iş tiplerini al (Bakım, Arıza vb.)
  const subTypes = sectorData?.subTypes ? Object.keys(sectorData.subTypes) : [];

  const handleSubTypeChange = (e) => {
    const subType = e.target.value;
    setSelectedSubType(subType);
    // İş tipi değişince önceki dinamik alanları temizle ve yeni iş tipini kaydet
    setJobForm(prev => ({
      ...prev,
      workType: subType,
      dynamicFields: {}
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobForm(prev => ({
      ...prev,
      dynamicFields: { ...prev.dynamicFields, [name]: value }
    }));
  };

  return (
    <div className="space-y-8">
      {/* 1. ADIM: İŞ TİPİ SEÇİMİ */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">İş / Hizmet Tipi</label>
        <select
          value={selectedSubType}
          onChange={handleSubTypeChange}
          className="w-full px-4 py-4 bg-blue-50/50 border-2 border-blue-100 rounded-2xl text-sm font-bold text-blue-900 outline-none"
        >
          <option value="">İş Tipi Seçiniz...</option>
          {subTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      {/* 2. ADIM: SEÇİLEN İŞ TİPİNE GÖRE DİNAMİK ALANLAR */}
      {selectedSubType && sectorData.subTypes[selectedSubType].fields
        // Patron (Admin) modundaysak sadece teknik olmayan alanları göster
        .filter(field => isAdmin ? (!field.technical || field.adminOnly) : true)
        .map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              {field.label}
            </label>
            
            {field.type === 'select' ? (
              <select
                name={field.name}
                value={jobForm.dynamicFields[field.name] || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Seçiniz...</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={jobForm.dynamicFields[field.name] || ''}
                placeholder={`${field.label} giriniz...`}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            )}
          </div>
        ))}
    </div>
  );
}