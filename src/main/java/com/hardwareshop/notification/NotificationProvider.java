package com.hardwareshop.notification;

public interface NotificationProvider {
    boolean sendWhatsApp(String to, String message);
    boolean sendSms(String to, String message);
    String getName();
}
