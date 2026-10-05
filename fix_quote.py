import os

with open('components/modals/forms/QuoteModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add hidden printable div
printable_div = '''
      <div style={{ display: "none" }}>
        <div ref={printRef} className="p-8 bg-white text-black max-w-2xl mx-auto font-sans">
          <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-black">{data?.settings?.company_name || 'Firma Adı'}</h1>
              <p className="text-sm font-medium mt-1">{quoteType}</p>
            </div>
            <div className="text-right text-sm">
              <p><strong>Tarih:</strong> {new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
          
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Müşteri Bilgileri</h3>
              <p><strong>İsim:</strong> {customerName}</p>
              <p><strong>Telefon:</strong> {customerPhone}</p>
              {customerEmail && <p><strong>E-posta:</strong> {customerEmail}</p>}
            </div>
            <div>
              <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Sistem Bilgileri</h3>
              <p><strong>Sistem Adı:</strong> {newAssetMode ? newAssetName : (data?.assets?.find((a: any) => a.id.toString() === selectedAssetId)?.name || 'Bilinmiyor')}</p>
              {quoteType === 'Revizyon Teklifi' && <p><strong>Detay:</strong> {revisionDetails}</p>}
              {quoteType === 'Montaj Teklifi' && (
                <>
                  <p><strong>Tipi:</strong> {elevatorType}</p>
                  <p><strong>Durak:</strong> {stopsCount}</p>
                  <p><strong>Kapasite:</strong> {capacity}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Sözleşme / Teklif Detayı</h3>
            <div className="text-sm whitespace-pre-wrap">{maintenanceContract}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-black text-center">
            <div>
              <p className="font-bold mb-16">Yetkili (Firma) İmzası</p>
              {employerCanvasRef.current && <img src={employerCanvasRef.current.toDataURL()} className="mx-auto h-20 object-contain mix-blend-multiply grayscale" />}
            </div>
            <div>
              <p className="font-bold mb-16">Müşteri İmzası</p>
              <p className="font-bold mb-2">{customerName}</p>
              {customerCanvasRef.current && <img src={customerCanvasRef.current.toDataURL()} className="mx-auto h-20 object-contain mix-blend-multiply grayscale" />}
            </div>
          </div>
        </div>
      </div>
'''

if 'ref={printRef}' not in content:
    content = content.replace('</AnimatePresence>', printable_div + '\\n    </AnimatePresence>')

if 'Tekliflere Git' not in content:
    content = content.replace(\"<button onClick={() => window.print()} className=\\\"w-full px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all\\\"><Download size={16}/> Convert to PDF</button>\", \"<button onClick={handlePrint} className=\\\"w-full px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all\\\"><Download size={16}/> PDF Olarak İndir</button>\")
    content = content.replace(\"<button onClick={() => window.print()} className=\\\"w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all\\\"><FileText size={16}/> Print Thermal Receipt</button>\", \"<button onClick={handlePrint} className=\\\"w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all\\\"><FileText size={16}/> Termal Fiş Yazdır</button>\")

    # Add the Tekliflere Git button
    btn = \"\"\"
                    <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm mx-auto mt-3">
                       <button onClick={() => { setShowQuoteModal(false); if (typeof window !== 'undefined') window.location.hash = 'quotes'; }} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">Sözleşmelere Git</button>
                    </div>
    \"\"\"
    content = content.replace('</>\\n                )}\\n              </div>\\n            </motion.div>', btn + '</>\\n                )}\\n              </div>\\n            </motion.div>')

with open('components/modals/forms/QuoteModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
