package com.hardwareshop.notification;

import org.springframework.stereotype.Service;

@Service
public class SmsNotificationService {

    private final NotificationProvider notificationProvider;

    public SmsNotificationService(NotificationProvider notificationProvider) {
        this.notificationProvider = notificationProvider;
    }

    public boolean sendSms(String recipientPhone, String message) {
        return notificationProvider.sendSms(recipientPhone, message);
    }
}
