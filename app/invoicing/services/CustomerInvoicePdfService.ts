// app/invoicing/services/CustomerInvoicePdfService.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface CustomerInvoiceItem {
  sku: string;
  productName: string;
  qty: number;
  price: number;
}

export interface CustomerInvoice {
  id?: string;
  invoiceNumber: string;
  recipient: string;
  date: string;
  dueDate: string;
  status: "DRAFT" | "BELUM BAYAR" | "LUNAS" | "JATUH TEMPO";
  items: CustomerInvoiceItem[];
  discount: number; // Nominal discount
  tax: number; // Percentage tax
  subtotal: number;
  total: number;
  notes?: string;
  bankInfo?: string;
}

export class CustomerInvoicePdfService {
  public static generatePdf(invoice: CustomerInvoice) {
    if (!invoice) return alert("❌ Data invoice kosong, gagal memproses.");

    // 1. Inisialisasi Kertas Ukuran A5 Portrait (148mm x 210mm)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });

    const brandName = "Simple and Yours";
    const dateFormatted = new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // --- LOGO & IDENTITAS PERUSAHAAN (Kiri Atas) ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(brandName, 12, 16);

    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Penyedia Home Hardware & Perlengkapan Rumah Tangga", 12, 21);
    doc.text("Tangerang, Banten, Indonesia", 12, 24.5);
    
    doc.setTextColor(0, 71, 171); // Cobalt Blue
    doc.setFont("Helvetica", "bold");
    doc.text("Email: sny.osho@gmail.com", 12, 28);

    // --- JUDUL DOKUMEN & NOMOR INVOICE (Kanan Atas) ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 71, 171); 
    doc.text("INVOICE", 136, 16, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(71, 85, 105); 
    doc.text(`#${invoice.invoiceNumber}`, 136, 21, { align: "right" });

    // Status Badge (Kanan Atas di bawah nomor invoice)
    const statusText = invoice.status.toUpperCase();
    let badgeColor = [71, 85, 105]; // grey
    if (statusText === "LUNAS") badgeColor = [16, 185, 129]; // emerald
    if (statusText === "BELUM BAYAR") badgeColor = [245, 158, 11]; // amber
    if (statusText === "JATUH TEMPO") badgeColor = [239, 68, 68]; // red
    if (statusText === "DRAFT") badgeColor = [100, 116, 139]; // slate

    doc.setFontSize(7);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.text(`STATUS: ${statusText}`, 136, 26, { align: "right" });

    // Garis Pembatas
    doc.setDrawColor(241, 245, 249); 
    doc.setLineWidth(0.4);
    doc.line(12, 31, 136, 31);

    // --- METADATA TRANSAKSI & PENERIMA ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("INFORMASI TAGIHAN", 12, 37);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    // Label Column (X=12) | Colon (X=40) | Value (X=43)
    doc.text("Nama Pelanggan", 12, 42);
    doc.text(":", 40, 42);
    doc.setFont("Helvetica", "bold");
    doc.text(invoice.recipient || "-", 43, 42);
    doc.setFont("Helvetica", "normal");

    doc.text("Tanggal Invoice", 12, 46);
    doc.text(":", 40, 46);
    doc.text(dateFormatted, 43, 46);

    doc.text("Jatuh Tempo", 12, 50);
    doc.text(":", 40, 50);
    doc.text(dueDateFormatted, 43, 50);

    // --- METADATA TABEL ITEM BARANG ---
    const tableBody = invoice.items.map((item, index) => [
      index + 1,
      String(item.sku).toUpperCase(),
      item.productName,
      `${item.qty} Pcs`,
      `Rp ${Math.round(item.price).toLocaleString('id-ID')}`,
      `Rp ${Math.round(item.price * item.qty).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: 55,
      margin: { left: 12, right: 12 },
      head: [["NO", "SKU", "DESKRIPSI PRODUK", "QTY", "HARGA SATUAN", "SUBTOTAL"]],
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: [0, 71, 171], 
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
        halign: "left"
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        font: "Helvetica"
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" }, 
        1: { cellWidth: 20 },                  
        2: { cellWidth: "auto" },              
        3: { cellWidth: 12, halign: "center" }, 
        4: { cellWidth: 22, halign: "right" },  
        5: { cellWidth: 22, halign: "right" }   
      },
      styles: {
        cellPadding: 2
      }
    });

    // --- RINGKASAN TOTAL AKHIR ---
    const finalY = ((doc as any).lastAutoTable?.finalY || 65) + 6;

    doc.setDrawColor(241, 245, 249);
    doc.line(12, finalY - 3, 136, finalY - 3);

    let currentY = finalY;

    // Subtotal
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Subtotal", 80, currentY);
    doc.text(`Rp ${Math.round(invoice.subtotal).toLocaleString('id-ID')}`, 136, currentY, { align: "right" });

    // Discount (jika ada)
    if (invoice.discount > 0) {
      currentY += 4;
      doc.text("Diskon", 80, currentY);
      doc.text(`-Rp ${Math.round(invoice.discount).toLocaleString('id-ID')}`, 136, currentY, { align: "right" });
    }

    // Tax (jika ada)
    if (invoice.tax > 0) {
      currentY += 4;
      doc.text(`Pajak (${invoice.tax}%)`, 80, currentY);
      const taxAmount = (invoice.subtotal - invoice.discount) * (invoice.tax / 100);
      doc.text(`+Rp ${Math.round(taxAmount).toLocaleString('id-ID')}`, 136, currentY, { align: "right" });
    }

    // Grand Total
    currentY += 5;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("GRAND TOTAL", 80, currentY);
    doc.setTextColor(0, 71, 171);
    doc.text(`IDR ${Math.round(invoice.total).toLocaleString('id-ID')}`, 136, currentY, { align: "right" });

    // --- CATATAN & DETAIL REKENING TRANSFER ---
    let blockY = currentY + 12;
    if (invoice.notes || invoice.bankInfo) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("INFORMASI PEMBAYARAN & CATATAN", 12, blockY);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);

      if (invoice.bankInfo) {
        blockY += 4.5;
        doc.setFont("Helvetica", "bold");
        doc.text("Transfer Bank:", 12, blockY);
        doc.setFont("Helvetica", "normal");
        const splitBank = doc.splitTextToSize(invoice.bankInfo, 60);
        doc.text(splitBank, 12, blockY + 3.5);
      }

      if (invoice.notes) {
        blockY += 4.5;
        doc.setFont("Helvetica", "bold");
        doc.text("Catatan:", 76, blockY);
        doc.setFont("Helvetica", "normal");
        const splitNotes = doc.splitTextToSize(invoice.notes, 60);
        doc.text(splitNotes, 76, blockY + 3.5);
      }
    }

    // --- FOOTER TANDA TANGAN ---
    const footerY = 192;
    doc.setDrawColor(241, 245, 249);
    doc.line(12, footerY - 4, 136, footerY - 4);

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Terima kasih atas kerja sama dan kepercayaan Anda.", 12, footerY);
    doc.text("Halaman ini sah diterbitkan secara digital oleh sistem ruko SNY.", 12, footerY + 2.5);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Hormat Kami,", 136, footerY, { align: "right" });
    
    // Tanda Tangan Brand
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text("Simple and Yours", 136, footerY + 9, { align: "right" });

    // Simpan PDF
    doc.save(`INVOICE-${invoice.invoiceNumber}.pdf`);
  }
}
