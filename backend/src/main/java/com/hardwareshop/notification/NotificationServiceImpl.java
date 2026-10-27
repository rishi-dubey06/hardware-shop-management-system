package com.hardwareshop.notification;

import com.hardwareshop.entity.*;
import com.hardwareshop.repository.NotificationLogRepository;
import com.hardwareshop.util.BillNotificationHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final WhatsAppNotificationService whatsAppService;
    private final SmsNotificationService smsService;
    private final NotificationLogRepository notificationLogRepository;

    @Value("${app.notification.admin-phone:+919876543210}")
    private String adminPhone;

    public NotificationServiceImpl(WhatsAppNotificationService whatsAppService,
                                   SmsNotificationService smsService,
                                   NotificationLogRepository notificationLogRepository) {
        this.whatsAppService = whatsAppService;
        this.smsService = smsService;
        this.notificationLogRepository = notificationLogRepository;
    }

    @Override
    @Async
    public void sendPurchaseNotification(Sale sale) {
        if (sale == null || sale.getCustomer() == null) {
            log.warn("Cannot send purchase notification: Sale or Customer is null");
            return;
        }

        Customer customer = sale.getCustomer();
        StringBuilder itemsList = new StringBuilder();
        if (sale.getItems() != null) {
            for (SaleItem item : sale.getItems()) {
                String prodName = item.getProduct() != null ? item.getProduct().getName() : "Item";
                itemsList.append(prodName)
                        .append(" × ")
                        .append(item.getQuantity())
                        .append("\n");
            }
        }

        String formattedAmount = formatCurrency(sale.getTotalAmount());
        String paymentStatusStr = sale.getPaymentStatus() == PaymentStatus.SUCCESS ? "SUCCESS" : "PENDING";

        String message = String.format("""
                Hello %s,

                Your purchase has been confirmed.

                Items:
                %s
                Total Bill: %s

                Payment Status: %s

                Thank you for shopping with us.
                """, customer.getName(), itemsList.toString().trim(), formattedAmount, paymentStatusStr);

        dispatchNotification(customer.getPhoneNumber(), message, NotificationType.PURCHASE_CONFIRMATION);
    }

    @Override
    @Async
    public void sendPaymentSuccessNotification(Sale sale) {
        if (sale == null || sale.getCustomer() == null) {
            log.warn("Cannot send payment success notification: Sale or Customer is null");
            return;
        }

        Customer customer = sale.getCustomer();
        StringBuilder itemsList = new StringBuilder();
        if (sale.getItems() != null) {
            for (SaleItem item : sale.getItems()) {
                String prodName = item.getProduct() != null ? item.getProduct().getName() : "Item";
                itemsList.append(prodName)
                        .append(" × ")
                        .append(item.getQuantity())
                        .append("\n");
            }
        }

        String formattedAmount = formatCurrency(sale.getTotalAmount());

        String message = String.format("""
                Payment Successful!

                Hello %s,

                Your payment has been successfully confirmed.

                Items:
                %s
                Amount Paid: %s
                Payment Method: %s
                Payment Status: SUCCESS

                Thank you for your purchase.
                """, customer.getName(), itemsList.toString().trim(), formattedAmount,
                sale.getPaymentMethod() != null ? sale.getPaymentMethod().name() : "CASH");

        dispatchNotification(customer.getPhoneNumber(), message, NotificationType.PAYMENT_CONFIRMATION);
    }

    @Override
    @Async
    public void sendLowStockNotification(Product product) {
        if (product == null) {
            return;
        }

        String message = String.format("""
                Low Stock Alert!

                Product: %s
                Current Stock: %d
                Alert Limit: %d

                Please restock this product.
                """, product.getName(), product.getAvailableQuantity(), product.getLowStockLimit());

        log.warn("Triggering low stock alert for product '{}': Current Stock={}, Limit={}",
                product.getName(), product.getAvailableQuantity(), product.getLowStockLimit());

        dispatchNotification(adminPhone, message, NotificationType.LOW_STOCK_ALERT);
    }

    private void dispatchNotification(String rawRecipient, String message, NotificationType type) {
        if (rawRecipient == null || rawRecipient.isBlank()) {
            log.warn("Cannot dispatch notification: Recipient phone is null or empty");
            return;
        }

        String normalized = BillNotificationHelper.normalizeIndianPhone(rawRecipient);
        String recipient = normalized.startsWith("+") ? normalized : ("+" + normalized);

        // Dispatch to WhatsApp
        try {
            NotificationResult waResult = whatsAppService.sendWhatsApp(recipient, message);
            NotificationLog logEntry = new NotificationLog(
                    recipient,
                    NotificationChannel.WHATSAPP,
                    type,
                    message,
                    waResult.status(),
                    waResult.providerMessageId(),
                    waResult.errorMessage(),
                    waResult.rawResponse(),
                    waResult.success() ? LocalDateTime.now() : null
            );
            notificationLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to log or send WhatsApp to {}: {}", recipient, e.getMessage());
        }

        // Dispatch to SMS
        try {
            NotificationResult smsResult = smsService.sendSms(recipient, message);
            NotificationLog logEntry = new NotificationLog(
                    recipient,
                    NotificationChannel.SMS,
                    type,
                    message,
                    smsResult.status(),
                    smsResult.providerMessageId(),
                    smsResult.errorMessage(),
                    smsResult.rawResponse(),
                    smsResult.success() ? LocalDateTime.now() : null
            );
            notificationLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to log or send SMS to {}: {}", recipient, e.getMessage());
        }
    }

    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null) return "₹0.00";
        NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return nf.format(amount).replace("INR", "₹").trim();
    }
}
