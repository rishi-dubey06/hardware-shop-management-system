package com.hardwareshop.service;

import com.hardwareshop.dto.response.BillResponse;
import com.hardwareshop.dto.response.SaleItemResponse;
import com.hardwareshop.entity.Customer;
import com.hardwareshop.entity.Sale;
import com.hardwareshop.entity.SaleItem;
import com.hardwareshop.util.BillNotificationHelper;
import com.hardwareshop.util.IndianCurrencyWords;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class BillService {

    private final SaleService saleService;

    @Value("${app.shop.name:XYZ HARDWARE SHOP}")
    private String shopName;

    @Value("${app.shop.contact:+91 98765 43210}")
    private String shopContact;

    @Value("${app.shop.address:Shop #12, Central Hardware Market, Sector 18, Greater Noida, UP}")
    private String shopAddress;

    @Value("${app.shop.gstin:09AABCU9603R1ZM}")
    private String shopGstin;

    @Value("${app.shop.state:09 - Uttar Pradesh}")
    private String shopState;

    public BillService(SaleService saleService) {
        this.saleService = saleService;
    }

    public BillResponse getBill(Long saleId) {
        Sale sale = saleService.getSaleEntity(saleId);
        Customer customer = sale.getCustomer();

        BillResponse bill = new BillResponse();
        bill.setSaleId(sale.getId());
        bill.setShopName(shopName);
        bill.setShopContact(shopContact);
        bill.setShopAddress(shopAddress);
        bill.setShopGstin(shopGstin);
        bill.setShopState(shopState);
        bill.setBillNumber(sale.getBillNumber());

        if (customer != null) {
            bill.setCustomerName(customer.getName());
            bill.setCustomerPhone(customer.getPhoneNumber());
            bill.setCustomerAddress(customer.getAddress() != null && !customer.getAddress().isBlank() ? customer.getAddress() : "Local Counter Sale");
        } else {
            bill.setCustomerName("Walk-in Customer");
            bill.setCustomerPhone("");
            bill.setCustomerAddress("Local Counter Sale");
        }

        bill.setSaleDate(sale.getSaleDate());
        bill.setSaleTime(sale.getSaleTime());
        bill.setTotalAmount(sale.getTotalAmount());
        bill.setFormattedTotal(BillNotificationHelper.formatCurrency(sale.getTotalAmount()));
        bill.setPaymentMethod(sale.getPaymentMethod() != null ? sale.getPaymentMethod().name() : "CASH");
        bill.setPaymentStatus(sale.getPaymentStatus() != null ? sale.getPaymentStatus().name() : "CONFIRMED");

        // Tax Calculation breakdown (standard GST 18% inclusive)
        BigDecimal total = sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal taxable = total.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
        BigDecimal totalGst = total.subtract(taxable);
        BigDecimal halfGst = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

        bill.setSubtotalAmount(taxable);
        bill.setCgstAmount(halfGst);
        bill.setSgstAmount(halfGst);
        bill.setTotalInWords(IndianCurrencyWords.convertToIndianCurrency(total));

        List<SaleItemResponse> itemResponses = new ArrayList<>();
        if (sale.getItems() != null) {
            for (SaleItem item : sale.getItems()) {
                String cat = item.getProduct() != null ? item.getProduct().getCategory() : "Hardware";
                String hsn = SaleItemResponse.resolveHsnCode(cat);
                itemResponses.add(new SaleItemResponse(
                        item.getId(),
                        item.getProduct() != null ? item.getProduct().getId() : null,
                        item.getProduct() != null ? item.getProduct().getName() : "Hardware Item",
                        cat,
                        hsn,
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                ));
            }
        }
        bill.setItems(itemResponses);

        // Prepopulate WhatsApp and SMS share URLs
        String waMessage = BillNotificationHelper.buildWhatsAppBillMessage(
                shopName, shopContact, shopAddress, shopGstin,
                sale.getBillNumber(), bill.getCustomerName(), sale.getSaleDate(),
                itemResponses, total, bill.getPaymentMethod(), bill.getPaymentStatus()
        );
        bill.setWhatsappShareUrl(BillNotificationHelper.createWhatsAppUrl(bill.getCustomerPhone(), waMessage));
        bill.setSmsShareUrl(BillNotificationHelper.createSmsUrl(bill.getCustomerPhone(), waMessage));

        // Generate printable receipt text
        bill.setPrintableReceiptText(generatePrintableText(bill));

        return bill;
    }

    public byte[] generatePdfBill(Long saleId) {
        BillResponse bill = getBill(saleId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 28, 28, 28, 28);
            PdfWriter.getInstance(document, out);
            document.open();

            // Color Palette
            Color navyDark = new Color(15, 23, 42);      // #0F172A
            Color slateHeader = new Color(30, 41, 59);   // #1E293B
            Color borderGray = new Color(203, 213, 225); // #CBD5E1
            Color bgLight = new Color(248, 250, 252);    // #F8FAFC
            Color accentAmber = new Color(180, 83, 9);   // #B45309
            Color textMuted = new Color(100, 116, 139);  // #64748B

            // Fonts
            Font shopTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 17, navyDark);
            Font shopSubtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, textMuted);
            Font bannerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, slateHeader);
            Font textBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, navyDark);
            Font textRegular = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, navyDark);
            Font thFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, Color.WHITE);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, textMuted);
            Font totalLargeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, accentAmber);

            // ==========================================
            // 1. SHOP HEADER & GST DETAILS
            // ==========================================
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);

            PdfPCell headerCell = new PdfPCell();
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);

            Paragraph pShopName = new Paragraph(bill.getShopName().toUpperCase(), shopTitleFont);
            pShopName.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(pShopName);

            Paragraph pSubtitle = new Paragraph("Dealers in Tools, Pipes, Sanitary, Paints, Electricals & Construction Materials\n"
                    + bill.getShopAddress() + " • Helpdesk: " + bill.getShopContact() + "\n"
                    + "GSTIN: " + bill.getShopGstin() + "  |  State: " + bill.getShopState() + "\n", shopSubtitleFont);
            pSubtitle.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(pSubtitle);

            headerTable.addCell(headerCell);
            document.add(headerTable);

            // ==========================================
            // 2. TAX INVOICE STRIP BANNER
            // ==========================================
            PdfPTable bannerTable = new PdfPTable(1);
            bannerTable.setWidthPercentage(100);
            bannerTable.setSpacingBefore(4);
            bannerTable.setSpacingAfter(6);

            PdfPCell bannerCell = new PdfPCell(new Phrase("TAX INVOICE  /  CASH MEMO (ORIGINAL FOR RECIPIENT)", bannerFont));
            bannerCell.setBackgroundColor(slateHeader);
            bannerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            bannerCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            bannerCell.setPaddingTop(4);
            bannerCell.setPaddingBottom(5);
            bannerCell.setBorder(Rectangle.NO_BORDER);
            bannerTable.addCell(bannerCell);
            document.add(bannerTable);

            // ==========================================
            // 3. INVOICE META & CUSTOMER INFO (2 COLUMNS)
            // ==========================================
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{1.1f, 0.9f});
            metaTable.setSpacingAfter(8);

            // Left Box: Billed To Customer
            PdfPCell custCell = new PdfPCell();
            custCell.setBorderColor(borderGray);
            custCell.setBorderWidth(1f);
            custCell.setBackgroundColor(bgLight);
            custCell.setPadding(7);

            custCell.addElement(new Paragraph("BILLED TO (CUSTOMER DETAILS)", sectionTitleFont));
            custCell.addElement(new Paragraph("Customer Name : " + bill.getCustomerName(), textBold));
            custCell.addElement(new Paragraph("Mobile / Phone: " + (bill.getCustomerPhone() != null && !bill.getCustomerPhone().isBlank() ? bill.getCustomerPhone() : "N/A"), textRegular));
            custCell.addElement(new Paragraph("Address       : " + bill.getCustomerAddress(), textRegular));
            custCell.addElement(new Paragraph("Place of Supply: " + bill.getShopState(), smallFont));
            metaTable.addCell(custCell);

            // Right Box: Invoice Details
            PdfPCell invCell = new PdfPCell();
            invCell.setBorderColor(borderGray);
            invCell.setBorderWidth(1f);
            invCell.setBackgroundColor(bgLight);
            invCell.setPadding(7);

            invCell.addElement(new Paragraph("INVOICE PARTICULARS", sectionTitleFont));
            invCell.addElement(new Paragraph("Invoice / Bill No: " + bill.getBillNumber(), textBold));
            invCell.addElement(new Paragraph("Invoice Date     : " + (bill.getSaleDate() != null ? bill.getSaleDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : ""), textRegular));
            invCell.addElement(new Paragraph("Time of Issue    : " + (bill.getSaleTime() != null ? bill.getSaleTime().format(DateTimeFormatter.ofPattern("hh:mm a")) : ""), textRegular));
            invCell.addElement(new Paragraph("Payment Mode     : " + bill.getPaymentMethod() + " (" + bill.getPaymentStatus() + ")", textBold));
            metaTable.addCell(invCell);

            document.add(metaTable);

            // ==========================================
            // 4. ITEMIZED GOODS TABLE (PROFESSIONAL GST GRID)
            // ==========================================
            PdfPTable itemsTable = new PdfPTable(6);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{0.8f, 4.4f, 1.4f, 1.0f, 1.8f, 2.0f});

            // Headers
            String[] headers = {"S.No.", "Description of Goods / Category", "HSN Code", "Qty", "Unit Rate (₹)", "Amount (₹)"};
            int[] aligns = {Element.ALIGN_CENTER, Element.ALIGN_LEFT, Element.ALIGN_CENTER, Element.ALIGN_CENTER, Element.ALIGN_RIGHT, Element.ALIGN_RIGHT};

            for (int i = 0; i < headers.length; i++) {
                PdfPCell th = new PdfPCell(new Phrase(headers[i], thFont));
                th.setBackgroundColor(slateHeader);
                th.setBorderColor(slateHeader);
                th.setHorizontalAlignment(aligns[i]);
                th.setVerticalAlignment(Element.ALIGN_MIDDLE);
                th.setPaddingTop(5);
                th.setPaddingBottom(5);
                th.setPaddingLeft(4);
                th.setPaddingRight(4);
                itemsTable.addCell(th);
            }

            // Items Rows
            int itemIndex = 1;
            boolean alternate = false;
            for (SaleItemResponse item : bill.getItems()) {
                Color rowBg = alternate ? bgLight : Color.WHITE;
                alternate = !alternate;

                // S.No.
                PdfPCell cIndex = new PdfPCell(new Phrase(String.valueOf(itemIndex++), textRegular));
                cIndex.setHorizontalAlignment(Element.ALIGN_CENTER);
                cIndex.setBackgroundColor(rowBg);
                cIndex.setBorderColor(borderGray);
                cIndex.setPadding(5);
                itemsTable.addCell(cIndex);

                // Description & Category
                Paragraph descPara = new Paragraph(item.getProductName(), textBold);
                if (item.getProductCategory() != null && !item.getProductCategory().isBlank()) {
                    descPara.add(new Chunk("\n[" + item.getProductCategory() + "]", smallFont));
                }
                PdfPCell cDesc = new PdfPCell(descPara);
                cDesc.setBackgroundColor(rowBg);
                cDesc.setBorderColor(borderGray);
                cDesc.setPadding(5);
                itemsTable.addCell(cDesc);

                // HSN Code
                PdfPCell cHsn = new PdfPCell(new Phrase(item.getHsnCode(), textRegular));
                cHsn.setHorizontalAlignment(Element.ALIGN_CENTER);
                cHsn.setBackgroundColor(rowBg);
                cHsn.setBorderColor(borderGray);
                cHsn.setPadding(5);
                itemsTable.addCell(cHsn);

                // Qty
                PdfPCell cQty = new PdfPCell(new Phrase(String.valueOf(item.getQuantity()), textBold));
                cQty.setHorizontalAlignment(Element.ALIGN_CENTER);
                cQty.setBackgroundColor(rowBg);
                cQty.setBorderColor(borderGray);
                cQty.setPadding(5);
                itemsTable.addCell(cQty);

                // Unit Price
                PdfPCell cPrice = new PdfPCell(new Phrase(formatPrice(item.getUnitPrice()), textRegular));
                cPrice.setHorizontalAlignment(Element.ALIGN_RIGHT);
                cPrice.setBackgroundColor(rowBg);
                cPrice.setBorderColor(borderGray);
                cPrice.setPadding(5);
                itemsTable.addCell(cPrice);

                // Subtotal
                PdfPCell cTotal = new PdfPCell(new Phrase(formatPrice(item.getSubtotal()), textBold));
                cTotal.setHorizontalAlignment(Element.ALIGN_RIGHT);
                cTotal.setBackgroundColor(rowBg);
                cTotal.setBorderColor(borderGray);
                cTotal.setPadding(5);
                itemsTable.addCell(cTotal);
            }

            document.add(itemsTable);

            // ==========================================
            // 5. TAX BREAKDOWN & AMOUNT IN WORDS SECTION
            // ==========================================
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{1.2f, 0.8f});
            summaryTable.setSpacingBefore(6);

            // Left Box: Words, Bank Details, Terms
            PdfPCell leftBox = new PdfPCell();
            leftBox.setBorderColor(borderGray);
            leftBox.setBorderWidth(1f);
            leftBox.setPadding(6);

            leftBox.addElement(new Paragraph("Amount Chargeable (in words):", sectionTitleFont));
            leftBox.addElement(new Paragraph(bill.getTotalInWords(), textBold));

            Paragraph bankPara = new Paragraph("\nBank & UPI Details for Payment:\n"
                    + "Bank: State Bank of India  |  A/C: 39820011002233\n"
                    + "IFSC: SBIN0001234  |  UPI ID: " + bill.getShopContact().replaceAll("[^0-9]", "") + "@upi\n", smallFont);
            leftBox.addElement(bankPara);

            Paragraph termsPara = new Paragraph("Terms & Conditions:\n"
                    + "1. Goods once sold will be replaced within 7 days with original invoice.\n"
                    + "2. Warranty is directly covered under respective manufacturer terms.\n"
                    + "3. All disputes subject to local jurisdiction.", smallFont);
            leftBox.addElement(termsPara);

            summaryTable.addCell(leftBox);

            // Right Box: Financials & GST Breakdown
            PdfPCell rightBox = new PdfPCell();
            rightBox.setBorderColor(borderGray);
            rightBox.setBorderWidth(1f);
            rightBox.setPadding(0);

            PdfPTable calcTable = new PdfPTable(2);
            calcTable.setWidthPercentage(100);
            calcTable.setWidths(new float[]{1.1f, 0.9f});

            addCalcRow(calcTable, "Taxable Amount:", formatPrice(bill.getSubtotalAmount()), textRegular, borderGray);
            addCalcRow(calcTable, "CGST @ 9%:", formatPrice(bill.getCgstAmount()), textRegular, borderGray);
            addCalcRow(calcTable, "SGST @ 9%:", formatPrice(bill.getSgstAmount()), textRegular, borderGray);
            addCalcRow(calcTable, "Round Off:", "₹0.00", textRegular, borderGray);

            // Grand Total Row (Highlighted)
            PdfPCell grandLabel = new PdfPCell(new Phrase("GRAND TOTAL", textBold));
            grandLabel.setBackgroundColor(new Color(254, 243, 199)); // #FEF3C7 amber light
            grandLabel.setPadding(6);
            grandLabel.setBorderColor(borderGray);
            calcTable.addCell(grandLabel);

            PdfPCell grandVal = new PdfPCell(new Phrase(BillNotificationHelper.formatCurrency(bill.getTotalAmount()), totalLargeFont));
            grandVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            grandVal.setBackgroundColor(new Color(254, 243, 199));
            grandVal.setPadding(6);
            grandVal.setBorderColor(borderGray);
            calcTable.addCell(grandVal);

            rightBox.addElement(calcTable);
            summaryTable.addCell(rightBox);

            document.add(summaryTable);

            // ==========================================
            // 6. AUTHORIZED SIGNATORY & FOOTER
            // ==========================================
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setSpacingBefore(18);

            PdfPCell custSignCell = new PdfPCell();
            custSignCell.setBorder(Rectangle.NO_BORDER);
            custSignCell.addElement(new Paragraph("\n\n_________________________________", smallFont));
            custSignCell.addElement(new Paragraph("Customer's Signature", smallFont));
            signTable.addCell(custSignCell);

            PdfPCell shopSignCell = new PdfPCell();
            shopSignCell.setBorder(Rectangle.NO_BORDER);
            shopSignCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph forShop = new Paragraph("For " + bill.getShopName().toUpperCase(), textBold);
            forShop.setAlignment(Element.ALIGN_RIGHT);
            shopSignCell.addElement(forShop);

            Paragraph signLine = new Paragraph("\n\n_________________________________\nAuthorized Signatory (Seal & Sign)", smallFont);
            signLine.setAlignment(Element.ALIGN_RIGHT);
            shopSignCell.addElement(signLine);
            signTable.addCell(shopSignCell);

            document.add(signTable);

            // Bottom Note
            Paragraph footerNote = new Paragraph("\nComputer Generated GST Tax Invoice • Thank You for Your Business!", smallFont);
            footerNote.setAlignment(Element.ALIGN_CENTER);
            document.add(footerNote);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating professional PDF bill: " + e.getMessage(), e);
        }
    }

    private void addCalcRow(PdfPTable table, String label, String value, Font font, Color borderColor) {
        PdfPCell cLabel = new PdfPCell(new Phrase(label, font));
        cLabel.setPadding(5);
        cLabel.setBorderColor(borderColor);
        table.addCell(cLabel);

        PdfPCell cVal = new PdfPCell(new Phrase(value.startsWith("₹") ? value : "₹" + value, font));
        cVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cVal.setPadding(5);
        cVal.setBorderColor(borderColor);
        table.addCell(cVal);
    }

    private String generatePrintableText(BillResponse bill) {
        StringBuilder sb = new StringBuilder();
        sb.append("====================================================\n");
        sb.append(String.format("          %s\n", bill.getShopName().toUpperCase()));
        sb.append(String.format("   %s\n", bill.getShopAddress()));
        sb.append(String.format("   Helpdesk: %s | GSTIN: %s\n", bill.getShopContact(), bill.getShopGstin()));
        sb.append("====================================================\n");
        sb.append("               TAX INVOICE / CASH MEMO\n");
        sb.append("----------------------------------------------------\n");
        sb.append(String.format("Bill No  : %-20s Date: %s\n", bill.getBillNumber(),
                bill.getSaleDate() != null ? bill.getSaleDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : ""));
        sb.append(String.format("Customer : %-20s Phone: %s\n", bill.getCustomerName(), bill.getCustomerPhone()));
        sb.append(String.format("Address  : %s\n", bill.getCustomerAddress()));
        sb.append("----------------------------------------------------\n");
        sb.append(String.format("%-22s %-6s %4s %8s %9s\n", "Item", "HSN", "Qty", "Rate", "Total"));
        sb.append("----------------------------------------------------\n");

        for (SaleItemResponse item : bill.getItems()) {
            String name = item.getProductName();
            if (name.length() > 21) name = name.substring(0, 18) + "...";
            sb.append(String.format("%-22s %-6s %4d %8s %9s\n",
                    name,
                    item.getHsnCode(),
                    item.getQuantity(),
                    formatPrice(item.getUnitPrice()),
                    formatPrice(item.getSubtotal())));
        }

        sb.append("----------------------------------------------------\n");
        sb.append(String.format("Taxable Subtotal : %35s\n", formatPrice(bill.getSubtotalAmount())));
        sb.append(String.format("CGST (9%%)        : %35s\n", formatPrice(bill.getCgstAmount())));
        sb.append(String.format("SGST (9%%)        : %35s\n", formatPrice(bill.getSgstAmount())));
        sb.append("----------------------------------------------------\n");
        sb.append(String.format("GRAND TOTAL      : %35s\n", BillNotificationHelper.formatCurrency(bill.getTotalAmount())));
        sb.append("----------------------------------------------------\n");
        sb.append(String.format("In Words: %s\n", bill.getTotalInWords()));
        sb.append(String.format("Payment Mode: %s (%s)\n", bill.getPaymentMethod(), bill.getPaymentStatus()));
        sb.append("====================================================\n");
        sb.append("          Thank you for shopping with us!\n");
        sb.append("====================================================\n");

        return sb.toString();
    }

    private String formatPrice(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toString();
    }
}
