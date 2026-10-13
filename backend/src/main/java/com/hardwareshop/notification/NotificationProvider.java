package com.hardwareshop.notification;

public interface NotificationProvider {
    NotificationResult sendWhatsApp(String to, String message);
    NotificationResult sendSms(String to, String message);
    String getName();
}
