package com.hardwareshop.notification.provider;

import com.hardwareshop.notification.NotificationProvider;
import com.hardwareshop.notification.NotificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.notification.provider", havingValue = "mock", matchIfMissing = true)
public class LoggingNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(LoggingNotificationProvider.class);

    @Override
    public NotificationResult sendWhatsApp(String to, String message) {
        String mockId = "MOCK-WA-" + UUID.randomUUID().toString().substring(0, 8);
        log.info("""
                
                ================== [MOCK WHATSAPP NOTIFICATION] ==================
                To: {}
                Message-ID: {}
                ------------------------------------------------------------------
                {}
                ==================================================================
                """, to, mockId, message);
        return NotificationResult.simulated(mockId, "Local simulation (No live WhatsApp credentials configured)");
    }

    @Override
    public NotificationResult sendSms(String to, String message) {
        String mockId = "MOCK-SMS-" + UUID.randomUUID().toString().substring(0, 8);
        log.info("""
                
                ===================== [MOCK SMS NOTIFICATION] =====================
                To: {}
                Message-ID: {}
                ------------------------------------------------------------------
                {}
                ==================================================================
                """, to, mockId, message);
        return NotificationResult.simulated(mockId, "Local simulation (No live SMS credentials configured)");
    }

    @Override
    public String getName() {
        return "LoggingMockProvider";
    }
}
