package com.hardwareshop.util;

import com.hardwareshop.dto.response.SaleItemResponse;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

public final class BillNotificationHelper {

    private BillNotificationHelper() {
    }

    public static String normalizeIndianPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return "";
        }
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            return "91" + digits;
        } else if (digits.length() == 11 && digits.startsWith("0")) {
            return "91" + digits.substring(1);
        } else if (digits.length() == 12 && digits.startsWith("91")) {
            return digits;
        }
        return digits;
    }

    public static String buildWhatsAppBillMessage(String shopName, String shopContact, String shopAddress,
                                                  String shopGstin, String billNumber, String customerName,
                                                  LocalDate saleDate, List<SaleItemResponse> items,
                                                  BigDecimal totalAmount, String paymentMethod, String paymentStatus) {
        StringBuilder sb = new StringBuilder();
        sb.append("🧾 *TAX INVOICE / CASH MEMO*\n");
        sb.append("🏪 *").append(shopName != null ? shopName.toUpperCase() : "HARDWARE STORE").append("*\n");
        if (shopAddress != null && !shopAddress.isBlank()) {
            sb.append("📍 ").append(shopAddress).append("\n");
        }
        if (shopContact != null && !shopContact.isBlank()) {
            sb.append("📞 Helpdesk: ").append(shopContact).append("\n");
        }
        if (shopGstin != null && !shopGstin.isBlank()) {
            sb.append("🏷️ GSTIN: ").append(shopGstin).append("\n");
        }
        sb.append("━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("📄 *Invoice No:* ").append(billNumber != null ? billNumber : "N/A").append("\n");
        sb.append("📅 *Date:* ").append(saleDate != null ? saleDate.format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : LocalDate.now().toString()).append("\n");
        sb.append("👤 *Customer:* ").append(customerName != null ? customerName : "Valued Customer").append("\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("*ITEMS PURCHASED:*\n");

        if (items != null && !items.isEmpty()) {
            int idx = 1;
            for (SaleItemResponse item : items) {
                sb.append(idx++).append(". ").append(item.getProductName())
                        .append(" × ").append(item.getQuantity())
                        .append(" = ").append(formatCurrency(item.getSubtotal()))
                        .append("\n");
            }
        }

        sb.append("━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("💰 *TOTAL PAYABLE: ").append(formatCurrency(totalAmount)).append("*\n");
        sb.append("💳 *Payment Mode:* ").append(paymentMethod != null ? paymentMethod : "CASH");
        sb.append(" (").append(paymentStatus != null ? paymentStatus : "CONFIRMED").append(")\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("🙏 *Thank you for shopping with us!*\n");
        sb.append("Please retain this digital bill for warranty and tax reference.");

        return sb.toString();
    }

    public static String createWhatsAppUrl(String rawPhone, String message) {
        String phone = normalizeIndianPhone(rawPhone);
        if (phone.isBlank()) {
            phone = "";
        }
        String encodedText = URLEncoder.encode(message, StandardCharsets.UTF_8).replace("+", "%20");
        return "https://api.whatsapp.com/send?phone=" + phone + "&text=" + encodedText;
    }

    public static String createSmsUrl(String rawPhone, String message) {
        String phone = normalizeIndianPhone(rawPhone);
        String recipient = phone.isBlank() ? "" : (phone.startsWith("+") ? phone : ("+" + phone));
        String encodedText = URLEncoder.encode(message, StandardCharsets.UTF_8).replace("+", "%20");
        return "sms:" + recipient + "?body=" + encodedText;
    }

    public static String formatCurrency(BigDecimal amount) {
        if (amount == null) return "₹0.00";
        NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return nf.format(amount).replace("INR", "₹").trim();
    }
}
