import { collection, doc, addDoc, updateDoc, deleteDoc, query, onSnapshot, QueryConstraint } from "firebase/firestore";
import { db } from "./firebase";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import saveAs from 'file-saver';
import { Bill } from "../types";

// Memory cache for instantaneous tab switching
let billsCache: Bill[] | null = null;

// Firebase interactions
export const subscribeToBills = (callback: (data: Bill[]) => void, constraints: QueryConstraint[] = []) => {
    // Optimistic UI yield
    if (billsCache) {
        callback(billsCache);
    }

    const q = query(collection(db, 'bills'), ...constraints);
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Bill[];
        
        billsCache = data;
        callback(data);
    });
};

export const updateBill = async (id: string, data: Partial<Bill>) => {
    const docRef = doc(db, 'bills', id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
    });
};

export const deleteBill = async (id: string) => {
    const docRef = doc(db, 'bills', id);
    await deleteDoc(docRef);
};

export const autoGenerateBill = async (orderData: any) => {
    const billItems = [{
        productName: orderData.productName,
        quantity: orderData.quantity,
        price: orderData.unitPrice || orderData.pricePerUnit,
        amount: orderData.totalAmount || orderData.amount
    }];
    
    await addDoc(collection(db, 'bills'), {
        orderId: orderData.id || '',
        customerId: orderData.customerId || '',
        customerName: orderData.customerName || orderData.customer || 'Unknown Customer',
        date: new Date().toISOString().split('T')[0],
        amount: orderData.totalAmount || orderData.amount || 0,
        status: 'Pending',
        items: billItems,
        createdAt: new Date().toISOString()
    });
};

// Number to Words Converter for Indian Rupee System
export const numberToWords = (num: number): string => {
    if (isNaN(num) || num < 0) return '';
    if (num === 0) return 'Zero Rupees Only';

    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    // Handle large numbers by breaking up strings
    const numStr = Math.floor(num).toString();
    if (numStr.length > 9) return 'Amount too large Rupees Only';

    const paddedNum = ('000000000' + numStr).slice(-9);
    const n = paddedNum.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    
    if (!n) return '';
    
    let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[parseInt(n[1][0])] + ' ' + a[parseInt(n[1][1])]) + 'Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[parseInt(n[2][0])] + ' ' + a[parseInt(n[2][1])]) + 'Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[parseInt(n[3][0])] + ' ' + a[parseInt(n[3][1])]) + 'Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[parseInt(n[4][0])] + ' ' + a[parseInt(n[4][1])]) + 'Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[parseInt(n[5][0])] + ' ' + a[parseInt(n[5][1])]) : '';
    
    return str.trim() + ' Rupees Only';
};

// PDF Generation using the fixed Indian.Invoice.pdf template
export const downloadPdfInvoice = async (bill: Bill) => {
    try {
        console.log("Starting PDF generation for:", bill.id);
        const url = '/bills/Indian.Invoice.pdf?t=' + new Date().getTime(); // cache-buster
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`Failed to fetch template: ${res.statusText}`);
        }
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error('Template path returned HTML instead of PDF. Path may be incorrect.');
        }

        const existingPdfBytes = await res.arrayBuffer();
        if (existingPdfBytes.byteLength < 1000) {
            throw new Error('Fetched template is unusually small, may be corrupted.');
        }

        console.log("Template loaded successfully, parsing PDF...");
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        console.log("PDF parsed, embedding fonts...");
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        const { width, height } = firstPage.getSize();
        
        // Customer Name
        firstPage.drawText(bill.customerName || 'Customer', {
            x: 60,
            y: height - 190,
            size: 14,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
        });

        // Date
        firstPage.drawText(`Date: ${bill.date || ''}`, {
            x: width - 200,
            y: height - 190,
            size: 11,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
        });
        
        // Invoice ID
        const invId = `INV-${bill.id.substring(0, 6).toUpperCase()}`;
        firstPage.drawText(`Invoice #${invId}`, {
            x: width - 200,
            y: height - 170,
            size: 12,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1)
        });

        // Items Logic
        let currentY = height - 320; 
        if (bill.items && bill.items.length > 0) {
            bill.items.forEach((item) => {
                firstPage.drawText(item.productName || 'Product', { x: 60, y: currentY, size: 10, font: font, color: rgb(0.2, 0.2, 0.2) });
                firstPage.drawText(`${item.quantity}`, { x: width - 220, y: currentY, size: 10, font: font, color: rgb(0.2, 0.2, 0.2) });
                firstPage.drawText(`Rs ${Number(item.price).toFixed(2)}`, { x: width - 150, y: currentY, size: 10, font: font, color: rgb(0.2, 0.2, 0.2) });
                firstPage.drawText(`Rs ${Number(item.amount).toFixed(2)}`, { x: width - 80, y: currentY, size: 10, font: font, color: rgb(0.2, 0.2, 0.2) });
                currentY -= 25; 
            });
        }

        firstPage.drawText(`Rs ${Number(bill.amount).toFixed(2)}`, {
            x: width - 120,
            y: 180, 
            size: 14,
            font: boldFont,
            color: rgb(0, 0, 0)
        });

        const inWords = numberToWords(Math.round(bill.amount));
        firstPage.drawText(`Amount in words: ${inWords}`, {
            x: 60,
            y: 140, 
            size: 10,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2)
        });

        console.log("Saving PDF bytes...");
        const pdfBytes = await pdfDoc.save();
        
        console.log("Triggering download...");
        const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
        saveAs(blob, `Invoice-${invId}.pdf`);
        console.log("Download triggered successfully.");
    } catch (e: any) {
        console.error("Failed to generate PDF invoice:", e);
        alert(`Could not generate PDF: ${e.message || 'Unknown error'}. Please ensure the template exists in public/bills.`);
    }
};
