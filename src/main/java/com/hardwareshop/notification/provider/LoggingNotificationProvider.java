package com.hardwareshop.notification.provider;

import com.hardwareshop.notification.NotificationProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.notification.provider", havingValue = "mock", matchIfMissing = true)
public class LoggingNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(LoggingNotificationProvider.class);

    @Override
    public boolean sendWhatsApp(String to, String message) {
        log.info("""
                
                ================== [MOCK WHATSAPP NOTIFICATION] ==================
                To: {}
                ------------------------------------------------------------------
                {}
                ==================================================================
                """, to, message);
        return true;
    }

    @Override
    public boolean sendSms(String to, String message) {
        log.info("""
                
                ===================== [MOCK SMS NOTIFICATION] =====================
                To: {}
                ------------------------------------------------------------------
                {}
                ==================================================================
                """, to, message);
        return true;
    }

    @Override
    public String getName() {
        return "LoggingMockProvider";
    }
}
