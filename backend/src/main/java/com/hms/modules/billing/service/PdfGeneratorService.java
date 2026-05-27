package com.hms.modules.billing.service;

import com.hms.modules.billing.entity.Billing;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfGeneratorService {

    public byte[] generateInvoicePdf(Billing billing) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // ─── Font Styles ──────────────────────────────────────────────────────────
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(212, 175, 55)); // Luxury Gold
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(120, 120, 120));
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(40, 40, 40));
            Font boldTextFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(40, 40, 40));
            Font goldHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(212, 175, 55));

            // ─── Header Section ───────────────────────────────────────────────────────
            Paragraph header = new Paragraph("PG CARE CLINICAL HEALTHCARE", titleFont);
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingAfter(5);
            document.add(header);

            Paragraph address = new Paragraph("Vintage Plaza, Suite 777 • Luxury Midnight Navy Hub • Tel: +1 800-PG-CARE", subtitleFont);
            address.setAlignment(Element.ALIGN_CENTER);
            address.setSpacingAfter(25);
            document.add(address);

            // Gold colored dividing line
            Paragraph divider = new Paragraph("______________________________________________________________________________", 
                    FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(212, 175, 55)));
            divider.setSpacingAfter(20);
            document.add(divider);

            // ─── Billing Details 2-Column Information Table ───────────────────────────
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(25);

            // Patient Info Cell
            PdfPCell patientCell = new PdfPCell();
            patientCell.setBorder(Rectangle.NO_BORDER);
            patientCell.addElement(new Paragraph("INVOICE TO:", subtitleFont));
            patientCell.addElement(new Paragraph(billing.getPatient().getName(), boldTextFont));
            patientCell.addElement(new Paragraph("Email: " + billing.getPatient().getEmail(), textFont));
            patientCell.addElement(new Paragraph("Phone: " + billing.getPatient().getPhone(), textFont));
            infoTable.addCell(patientCell);

            // Invoice Info Cell
            PdfPCell invoiceCell = new PdfPCell();
            invoiceCell.setBorder(Rectangle.NO_BORDER);
            invoiceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            Paragraph invTitle = new Paragraph("INVOICE RECEIPT", boldTextFont);
            invTitle.setAlignment(Element.ALIGN_RIGHT);
            invoiceCell.addElement(invTitle);
            
            Paragraph invId = new Paragraph("Invoice ID: #" + billing.getId(), textFont);
            invId.setAlignment(Element.ALIGN_RIGHT);
            invoiceCell.addElement(invId);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            Paragraph dateStr = new Paragraph("Date: " + billing.getCreatedAt().format(formatter), textFont);
            dateStr.setAlignment(Element.ALIGN_RIGHT);
            invoiceCell.addElement(dateStr);

            Paragraph statusStr = new Paragraph("Payment Status: " + billing.getPaymentStatus().name(), boldTextFont);
            statusStr.setAlignment(Element.ALIGN_RIGHT);
            invoiceCell.addElement(statusStr);
            
            infoTable.addCell(invoiceCell);
            document.add(infoTable);

            // ─── Items Table ─────────────────────────────────────────────────────────
            PdfPTable itemsTable = new PdfPTable(3);
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingAfter(30);

            // Set Column Widths
            itemsTable.setWidths(new float[]{4f, 2f, 2f});

            // Table Headers
            PdfPCell h1 = new PdfPCell(new Paragraph("Description", goldHeaderFont));
            h1.setBackgroundColor(new Color(3, 7, 18)); // Midnight navy background mockup
            h1.setPadding(8);
            itemsTable.addCell(h1);

            PdfPCell h2 = new PdfPCell(new Paragraph("Booking ID", goldHeaderFont));
            h2.setBackgroundColor(new Color(3, 7, 18));
            h2.setPadding(8);
            h2.setHorizontalAlignment(Element.ALIGN_CENTER);
            itemsTable.addCell(h2);

            PdfPCell h3 = new PdfPCell(new Paragraph("Total Price", goldHeaderFont));
            h3.setBackgroundColor(new Color(3, 7, 18));
            h3.setPadding(8);
            h3.setHorizontalAlignment(Element.ALIGN_RIGHT);
            itemsTable.addCell(h3);

            // Row Data
            PdfPCell c1 = new PdfPCell(new Paragraph("Clinical Diagnosis Consultation Session\nDr. " + 
                    billing.getAppointment().getDoctor().getName(), textFont));
            c1.setPadding(10);
            itemsTable.addCell(c1);

            PdfPCell c2 = new PdfPCell(new Paragraph("#" + billing.getAppointment().getId(), textFont));
            c2.setPadding(10);
            c2.setHorizontalAlignment(Element.ALIGN_CENTER);
            itemsTable.addCell(c2);

            PdfPCell c3 = new PdfPCell(new Paragraph("$" + billing.getAmount().toString(), textFont));
            c3.setPadding(10);
            c3.setHorizontalAlignment(Element.ALIGN_RIGHT);
            itemsTable.addCell(c3);

            document.add(itemsTable);

            // ─── Summary / Totals ────────────────────────────────────────────────────
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(40);
            summaryTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            PdfPCell s1 = new PdfPCell(new Paragraph("Total Due:", boldTextFont));
            s1.setBorder(Rectangle.NO_BORDER);
            summaryTable.addCell(s1);

            PdfPCell s2 = new PdfPCell(new Paragraph("$" + billing.getAmount().toString(), boldTextFont));
            s2.setBorder(Rectangle.NO_BORDER);
            s2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.addCell(s2);

            document.add(summaryTable);

            // ─── Footer Notes ────────────────────────────────────────────────────────
            Paragraph footerGap = new Paragraph("\n\n\n\n");
            document.add(footerGap);

            Paragraph footer = new Paragraph("Thank you for choosing PG Care HMS. We wish you an elegant, healthy recovery.", subtitleFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }
}
