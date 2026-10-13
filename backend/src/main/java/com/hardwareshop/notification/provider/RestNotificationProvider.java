package com.hardwareshop.notification.provider;

import com.hardwareshop.notification.NotificationProvider;
import com.hardwareshop.notification.NotificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.notification.provider", havingValue = "rest")
public class RestNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(RestNotificationProvider.class);

    private final RestTemplate restTemplate;

    @Value("${app.notification.whatsapp.api-url:}")
    private String whatsappApiUrl;

    @Value("${app.notification.whatsapp.api-key:}")
    private String whatsappApiKey;

    @Value("${app.notification.sms.api-url:}")
    private String smsApiUrl;

    @Value("${app.notification.sms.api-key:}")
    private String smsApiKey;

    public RestNotificationProvider() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public NotificationResult sendWhatsApp(String to, String message) {
        if (!StringUtils.hasText(whatsappApiUrl) || !StringUtils.hasText(whatsappApiKey)) {
            log.warn("WhatsApp API URL or API Key is missing. Live WhatsApp dispatch blocked by credentials.");
            return NotificationResult.failed("BLOCKED: WhatsApp API URL or API Key missing in environment", null);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(whatsappApiKey);

            Map<String, Object> payload = new HashMap<>();
            payload.put("to", to);
            payload.put("type", "text");
            payload.put("text", Map.of("body", message));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(whatsappApiUrl, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                String id = "REST-WA-" + UUID.randomUUID().toString().substring(0, 8);
                return NotificationResult.sent(id, response.getBody());
            } else {
                return NotificationResult.failed("HTTP " + response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send WhatsApp message to {}: {}", to, e.getMessage());
            return NotificationResult.failed(e.getMessage(), null);
        }
    }

    @Override
    public NotificationResult sendSms(String to, String message) {
        if (!StringUtils.hasText(smsApiUrl) || !StringUtils.hasText(smsApiKey)) {
            log.warn("SMS API URL or API Key is missing. Live SMS dispatch blocked by credentials.");
            return NotificationResult.failed("BLOCKED: SMS API URL or API Key missing in environment", null);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + smsApiKey);

            Map<String, String> payload = new HashMap<>();
            payload.put("to", to);
            payload.put("body", message);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(smsApiUrl, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                String id = "REST-SMS-" + UUID.randomUUID().toString().substring(0, 8);
                return NotificationResult.sent(id, response.getBody());
            } else {
                return NotificationResult.failed("HTTP " + response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send SMS message to {}: {}", to, e.getMessage());
            return NotificationResult.failed(e.getMessage(), null);
        }
    }

    @Override
    public String getName() {
        return "RestNotificationProvider";
    }
}
