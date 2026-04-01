import { collection, doc, addDoc, updateDoc, deleteDoc, query, onSnapshot, QueryConstraint } from "firebase/firestore";
import { db } from "./firebase";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import saveAs from "file-saver";
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
        srNo: 1,
        description: orderData.productName || 'Product Name',
        material: orderData.rawMaterialType ? `${orderData.rawMaterialType} ${orderData.rawMaterialColor || ''}`.trim() : 'N/A',
        quantity: orderData.quantity || 1,
        rate: orderData.unitPrice || orderData.pricePerUnit || 0,
        total: orderData.totalAmount || orderData.amount || 0
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

// HTML to PDF Generation Engine
import { createRoot } from "react-dom/client";
import React from "react";
import InvoiceTemplate from "../components/InvoiceTemplate";
// @ts-ignore
import html2pdf from "html2pdf.js";

export const downloadPdfInvoice = async (bill: Bill) => {
    try {
        console.log("Starting PDF generation for:", bill.id);
        
        // Setup hidden container
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "0";
        document.body.appendChild(container);

        // Render template into container
        const root = createRoot(container);
        root.render(React.createElement(InvoiceTemplate, { bill }));

        // Wait for rendering and image loading
        await new Promise(resolve => setTimeout(resolve, 800));

        const element = container.querySelector("#invoice-template") as HTMLElement;
        if (!element) {
            throw new Error("Template failed to mount.");
        }

        const invId = `INV-${bill.id.substring(0, 6).toUpperCase()}`;

        const opt = {
            margin:       [0, 0, 0, 0] as [number, number, number, number],
            filename:     `Invoice-${invId}.pdf`,
            image:        { type: 'jpeg' as const, quality: 1.0 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as const }
        };

        console.log("Creating PDF...");
        await html2pdf().from(element).set(opt).save();
        console.log("PDF Triggered successfully.");

        // Cleanup
        setTimeout(() => {
            root.unmount();
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        }, 1000);

    } catch (e: any) {
        console.error("Failed to generate PDF invoice:", e);
        alert(`Could not generate PDF: ${e.message || 'Unknown error'}.`);
    }
};

