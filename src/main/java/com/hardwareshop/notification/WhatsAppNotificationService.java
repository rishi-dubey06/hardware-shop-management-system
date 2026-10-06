package com.hardwareshop.notification;

import org.springframework.stereotype.Service;

@Service
public class WhatsAppNotificationService {

    private final NotificationProvider notificationProvider;

    public WhatsAppNotificationService(NotificationProvider notificationProvider) {
        this.notificationProvider = notificationProvider;
    }

    public boolean sendWhatsApp(String recipientPhone, String message) {
        return notificationProvider.sendWhatsApp(recipientPhone, message);
    }
}
