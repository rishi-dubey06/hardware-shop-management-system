package com.hardwareshop.notification;

import com.hardwareshop.entity.Product;
import com.hardwareshop.entity.Sale;

public interface NotificationService {
    void sendPurchaseNotification(Sale sale);
    void sendPaymentSuccessNotification(Sale sale);
    void sendLowStockNotification(Product product);
}
