import React from 'react';
import { Bill } from '../types';
import { numberToWords } from '../services/billingService';

interface InvoiceTemplateProps {
  bill: Bill;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ bill }) => {
  const formattedDate = new Date(bill.date || new Date()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const totalWords = numberToWords(Math.round(bill.amount));

  return (
    <div
      id="invoice-template"
      style={{
        width: '794px', // Standard A4 width at 96 DPI
        minHeight: '1123px', // Standard A4 height at 96 DPI
        padding: '0',
        margin: '0',
        backgroundColor: '#ffffff',
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000000',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* ─── HEADER ─── */}
      <div style={{ padding: '30px 40px 15px 40px', backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        
        {/* The requested 3D Background Image (Lamps) stretching across the header */}
        <img 
          src="/lamps-bg.png" 
          alt="3D Objects Background" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, zIndex: 0 }} 
          onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if file missing
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          
          {/* Left: INVOICE & ENDLESS TEXT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: '900', 
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '2px',
              color: '#1a1a1a'
            }}>
              INVOICE
            </div>
            
            <div style={{ textAlign: 'center', paddingBottom: '4px' }}>
              <div style={{ fontSize: '36px', fontWeight: 'normal', fontFamily: '"Times New Roman", Times, serif', letterSpacing: '6px', color: '#1a1a1a' }}>ENDLESS</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: '"Times New Roman", Times, serif', letterSpacing: '1px', color: '#1a1a1a', marginTop: '2px' }}>3D PRINTING STUDIO</div>
            </div>
          </div>

          {/* Right: Baked Image Logo */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            {/* Using the newly uploaded combined logo which contains both the circular emblem and text string natively */}
            <img src="/new-logo-v3.png" alt="Endless Logo" style={{ height: '120px', width: 'auto', objectFit: 'contain', paddingRight: '10px' }} />
          </div>
        </div>
      </div>

      {/* THICK GOLD BORDER SEPARATOR */}
      <div style={{ width: '100%', height: '4px', backgroundColor: '#d4af37' }}></div>

      {/* ─── BODY CONTENT ─── */}
      <div style={{ padding: '20px 50px', position: 'relative', minHeight: '840px' }}>
        
        {/* Phone Number Header Right */}
        <div contentEditable suppressContentEditableWarning style={{ textAlign: 'right', fontSize: '18px', marginBottom: '15px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontFamily: 'Arial, sans-serif', outline: 'none' }}>
          {/* using unicode phone/whatsapp character or simple text */}
          <span style={{ fontSize: '24px', marginRight: '6px', pointerEvents: 'none' }}>✆</span> +91 9767973735
        </div>

        {/* Company Details (Fixed) */}
        <div style={{ fontSize: '15px', lineHeight: '1.4', marginBottom: '20px' }}>
          <div>From:</div>
          <div>BEENDLESS MANUFACTURING & MULTISERVICES</div>
          <div>Shop No.61, Jyotirmay Complex, Sector P-1, Cidco Town Centre, Seven Hills,</div>
          <div>Jalna Road ch.Sambhajinagar (Aurangabad) Maharashtra-431003.</div>
          <div style={{ marginTop: '10px' }}>GST NO: 27ABFFB7330J1ZE</div>
          <div>CONTACT: +91 97679 73735</div>
          <div>Email: endless3dprinting44@gmail.com</div>
        </div>

        {/* Customer Details (Dynamic) */}
        <div contentEditable suppressContentEditableWarning style={{ fontSize: '15px', lineHeight: '1.4', marginBottom: '25px', outline: 'none', padding: '4px', border: '1px dashed transparent', transition: '0.2s' }} className="hover:border-gray-200">
          <div>To,</div>
          <div>{bill.customerName}</div>
          {/* Since we don't store business name explicitly in Bill currently, we'll just check if it's there or omit */}
          <div style={{ marginTop: '5px' }}>Date: {formattedDate}</div>
        </div>

        {/* Table Title */}
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          Price Details
        </div>

        {/* Dynamic Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fcf8f0' }}> {/* subtle gold tint on header */}
              <th style={{ border: '2px solid #000', padding: '12px 8px', width: '8%', borderColor: '#111' }}>Sr.No<br/>.</th>
              <th style={{ border: '2px solid #000', padding: '12px 8px', width: '30%', borderColor: '#111' }}>Description<br/>of Item</th>
              <th style={{ border: '2px solid #000', padding: '12px 8px', width: '14%', borderColor: '#111' }}>Material</th>
              <th style={{ border: '2px solid #000', padding: '12px 8px', width: '14%', borderColor: '#111' }}>Quantity</th>
              <th style={{ border: '2px solid #000', padding: '12px 8px', width: '16%', borderColor: '#111' }}>Per<br/>Piece</th>
              <th style={{ border: '2px solid #000', padding: '12px 8px', width: '18%', borderColor: '#111' }}>Total</th>
            </tr>
          </thead>
          <tbody contentEditable suppressContentEditableWarning style={{ outline: 'none' }}>
            {bill.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '2px solid #000', padding: '12px 8px', fontWeight: 'bold' }}>{item.srNo || idx + 1}</td>
                <td style={{ border: '2px solid #000', padding: '12px 8px' }}>{item.description}</td>
                <td style={{ border: '2px solid #000', padding: '12px 8px', fontWeight: 'bold' }}>{item.material}</td>
                <td style={{ border: '2px solid #000', padding: '12px 8px' }}>{item.quantity}</td>
                <td style={{ border: '2px solid #000', padding: '12px 8px', fontWeight: 'bold' }}>{item.rate}/-</td>
                <td style={{ border: '2px solid #000', padding: '12px 8px', fontWeight: 'bold' }}>{item.total}/-</td>
              </tr>
            ))}
            {/* Sub Total Row */}
            <tr>
              <td style={{ border: '2px solid #000', padding: '12px 8px', fontWeight: 'bold' }}>Sub<br/>Total</td>
              <td style={{ border: '2px solid #000', padding: '12px 8px' }}>--</td>
              <td style={{ border: '2px solid #000', padding: '12px 8px' }}>---</td>
              <td style={{ border: '2px solid #000', padding: '12px 8px' }}>---</td>
              <td style={{ border: '2px solid #000', padding: '12px 8px', fontWeight: 'bold' }}>--</td>
              <td style={{ border: '2px solid #000', padding: '12px 8px', fontWeight: 'bold' }}>{Math.round(bill.amount)}/-</td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        <div contentEditable suppressContentEditableWarning style={{ marginTop: '25px', fontSize: '16px', fontWeight: 'bold', outline: 'none' }}>
          (Amount in Words: {totalWords} )
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ position: 'absolute', bottom: '0', width: '100%', backgroundColor: '#202020', color: '#fff', padding: '20px 40px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🌐</span> www.endless3dprinting.com
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>✉</span> endless3dprintingstudio44@gmail.com
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>📷</span> @3d_studio_be
          </div>
        </div>
        
        <div style={{ textAlign: 'right', lineHeight: '1.4' }}>
           <div style={{ marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#d4af37' }}>BE ENDLESS <span style={{fontSize:'8px', color:'#fff', fontStyle:'italic'}}>Dare To Start</span></div>
           <div>Shop No.61, Jyotirmay Complex, Sector P-1, Cidco Town</div>
           <div>Centre, Seven Hills, Jalna Road Ch.Sambhajinagar</div>
           <div>(Aurangabad) Maharashtra-431003.</div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
