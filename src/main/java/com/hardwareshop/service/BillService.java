package com.hardwareshop.service;

import com.hardwareshop.dto.response.BillResponse;
import com.hardwareshop.dto.response.SaleItemResponse;
import com.hardwareshop.entity.Customer;
import com.hardwareshop.entity.Sale;
import com.hardwareshop.entity.SaleItem;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class BillService {

    private final SaleService saleService;

    @Value("${app.shop.name:XYZ HARDWARE SHOP}")
    private String shopName;

    @Value("${app.shop.contact:+91 98765 43210}")
    private String shopContact;

    @Value("${app.shop.address:Shop #12, Central Hardware Market, Sector 18, Greater Noida, UP}")
    private String shopAddress;

    public BillService(SaleService saleService) {
        this.saleService = saleService;
    }

    public BillResponse getBill(Long saleId) {
        Sale sale = saleService.getSaleEntity(saleId);
        Customer customer = sale.getCustomer();

        BillResponse bill = new BillResponse();
        bill.setShopName(shopName);
        bill.setShopContact(shopContact);
        bill.setShopAddress(shopAddress);
        bill.setBillNumber(sale.getBillNumber());

        if (customer != null) {
            bill.setCustomerName(customer.getName());
            bill.setCustomerPhone(customer.getPhoneNumber());
            bill.setCustomerAddress(customer.getAddress());
        }

        bill.setSaleDate(sale.getSaleDate());
        bill.setSaleTime(sale.getSaleTime());
        bill.setTotalAmount(sale.getTotalAmount());
        bill.setPaymentMethod(sale.getPaymentMethod() != null ? sale.getPaymentMethod().name() : "CASH");
        bill.setPaymentStatus(sale.getPaymentStatus() != null ? sale.getPaymentStatus().name() : "PENDING");

        List<SaleItemResponse> itemResponses = new ArrayList<>();
        if (sale.getItems() != null) {
            for (SaleItem item : sale.getItems()) {
                itemResponses.add(new SaleItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getCategory(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                ));
            }
        }
        bill.setItems(itemResponses);

        // Generate printable receipt text
        bill.setPrintableReceiptText(generatePrintableText(bill));

        return bill;
    }

    public byte[] generatePdfBill(Long saleId) {
        BillResponse bill = getBill(saleId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Header Font
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            // Title & Shop details
            Paragraph shopHeader = new Paragraph(bill.getShopName(), titleFont);
            shopHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(shopHeader);

            Paragraph shopDetails = new Paragraph(bill.getShopAddress() + "\nContact: " + bill.getShopContact() + "\n", subFont);
            shopDetails.setAlignment(Element.ALIGN_CENTER);
            document.add(shopDetails);

            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------------------------\n", subFont));

            // Invoice & Customer Info Table
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);

            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.addElement(new Paragraph("Customer: " + bill.getCustomerName(), boldFont));
            leftCell.addElement(new Paragraph("Phone: " + bill.getCustomerPhone(), regularFont));
            leftCell.addElement(new Paragraph("Address: " + bill.getCustomerAddress(), regularFont));
            metaTable.addCell(leftCell);

            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(new Paragraph("Bill No: " + bill.getBillNumber(), boldFont));
            rightCell.addElement(new Paragraph("Date: " + bill.getSaleDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")), regularFont));
            rightCell.addElement(new Paragraph("Time: " + (bill.getSaleTime() != null ? bill.getSaleTime().format(DateTimeFormatter.ofPattern("hh:mm a")) : ""), regularFont));
            metaTable.addCell(rightCell);

            document.add(metaTable);
            document.add(new Paragraph("\n"));

            // Items Table
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 1.5f, 2f, 2.5f});

            // Table Header
            String[] headers = {"Item", "Qty", "Price (₹)", "Total (₹)"};
            for (String h : headers) {
                PdfPCell headerCell = new PdfPCell(new Phrase(h, boldFont));
                headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                headerCell.setPadding(6);
                table.addCell(headerCell);
            }

            // Items Rows
            for (SaleItemResponse item : bill.getItems()) {
                PdfPCell nameCell = new PdfPCell(new Phrase(item.getProductName(), regularFont));
                nameCell.setPadding(5);
                table.addCell(nameCell);

                PdfPCell qtyCell = new PdfPCell(new Phrase(String.valueOf(item.getQuantity()), regularFont));
                qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                qtyCell.setPadding(5);
                table.addCell(qtyCell);

                PdfPCell priceCell = new PdfPCell(new Phrase(formatPrice(item.getUnitPrice()), regularFont));
                priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                priceCell.setPadding(5);
                table.addCell(priceCell);

                PdfPCell totalCell = new PdfPCell(new Phrase(formatPrice(item.getSubtotal()), regularFont));
                totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                totalCell.setPadding(5);
                table.addCell(totalCell);
            }

            document.add(table);
            document.add(new Paragraph("\n"));

            // Total & Payment Summary
            Paragraph totalPara = new Paragraph("TOTAL AMOUNT: " + formatCurrency(bill.getTotalAmount()), boldFont);
            totalPara.setAlignment(Element.ALIGN_RIGHT);
            document.add(totalPara);

            Paragraph paymentPara = new Paragraph("Payment: " + bill.getPaymentMethod() + " | Status: " + bill.getPaymentStatus(), regularFont);
            paymentPara.setAlignment(Element.ALIGN_RIGHT);
            document.add(paymentPara);

            document.add(new Paragraph("\n\nThank you for your business!", subFont));

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF bill: " + e.getMessage(), e);
        }
    }

    private String generatePrintableText(BillResponse bill) {
        StringBuilder sb = new StringBuilder();
        sb.append("------------------------------------\n");
        sb.append(String.format("        %s\n", bill.getShopName()));
        sb.append("------------------------------------\n\n");
        sb.append(String.format("Bill No: %s\n\n", bill.getBillNumber()));
        sb.append(String.format("Customer: %s\n", bill.getCustomerName()));
        sb.append(String.format("Phone: %s\n", bill.getCustomerPhone()));
        sb.append(String.format("Address: %s\n\n", bill.getCustomerAddress()));
        sb.append(String.format("Date: %s\n", bill.getSaleDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))));
        sb.append(String.format("Time: %s\n\n", bill.getSaleTime() != null ? bill.getSaleTime().format(DateTimeFormatter.ofPattern("hh:mm a")) : ""));
        sb.append(String.format("%-18s %4s %8s %8s\n", "Item", "Qty", "Price", "Total"));
        sb.append("------------------------------------\n");

        for (SaleItemResponse item : bill.getItems()) {
            String name = item.getProductName();
            if (name.length() > 17) name = name.substring(0, 14) + "...";
            sb.append(String.format("%-18s %4d %8s %8s\n",
                    name,
                    item.getQuantity(),
                    formatPrice(item.getUnitPrice()),
                    formatPrice(item.getSubtotal())));
        }

        sb.append("------------------------------------\n");
        sb.append(String.format("TOTAL: %s\n", formatCurrency(bill.getTotalAmount())));
        sb.append("------------------------------------\n\n");
        sb.append(String.format("Payment: %s\n", bill.getPaymentMethod()));
        sb.append(String.format("Status: %s\n", bill.getPaymentStatus()));
        sb.append("------------------------------------\n");
        sb.append("      Thank you for shopping!\n");

        return sb.toString();
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "₹0.00";
        NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return nf.format(amount).replace("INR", "₹").trim();
    }

    private String formatPrice(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, java.math.RoundingMode.HALF_UP).toString();
    }
}
