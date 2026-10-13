package com.hardwareshop.notification.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hardwareshop.notification.NotificationProvider;
import com.hardwareshop.notification.NotificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.notification.provider", havingValue = "meta")
public class MetaWhatsAppNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(MetaWhatsAppNotificationProvider.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.notification.meta.api-token:${WHATSAPP_API_KEY:}}")
    private String apiToken;

    @Value("${app.notification.meta.phone-number-id:${WHATSAPP_PHONE_NUMBER_ID:}}")
    private String phoneNumberId;

    public MetaWhatsAppNotificationProvider() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public NotificationResult sendWhatsApp(String to, String message) {
        if (!isConfigured()) {
            String err = "BLOCKED: Meta WhatsApp Cloud API credentials not configured. Please supply WHATSAPP_API_KEY and WHATSAPP_PHONE_NUMBER_ID.";
            log.warn(err);
            return NotificationResult.failed(err, null);
        }

        String recipientDigits = to.replaceAll("[^0-9]", "");
        String url = String.format("https://graph.facebook.com/v20.0/%s/messages", phoneNumberId);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiToken);

            Map<String, Object> payload = new HashMap<>();
            payload.put("messaging_product", "whatsapp");
            payload.put("recipient_type", "individual");
            payload.put("to", recipientDigits);
            payload.put("type", "text");
            payload.put("text", Map.of("preview_url", false, "body", message));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                String messageId = "META-WA-MSG";
                if (json.has("messages") && json.get("messages").isArray() && !json.get("messages").isEmpty()) {
                    messageId = json.get("messages").get(0).get("id").asText();
                }
                log.info("Successfully dispatched live Meta WhatsApp message to {}. Meta Message ID: {}", recipientDigits, messageId);
                return NotificationResult.sent(messageId, response.getBody());
            } else {
                return NotificationResult.failed("Meta returned non-2xx status: " + response.getStatusCode(), response.getBody());
            }
        } catch (HttpStatusCodeException ex) {
            String responseBody = ex.getResponseBodyAsString();
            String errorMsg = extractMetaErrorMessage(responseBody, ex.getMessage());
            log.error("Meta WhatsApp dispatch error (HTTP {}): {}", ex.getStatusCode(), errorMsg);
            return NotificationResult.failed(errorMsg, responseBody);
        } catch (Exception ex) {
            log.error("Meta WhatsApp unexpected error: {}", ex.getMessage());
            return NotificationResult.failed(ex.getMessage(), null);
        }
    }

    @Override
    public NotificationResult sendSms(String to, String message) {
        // Meta WhatsApp Cloud API is WhatsApp-only. For SMS, indicate channel unsupported or delegate.
        return NotificationResult.failed("SMS not supported by Meta Cloud API provider. Use Twilio for dual SMS+WhatsApp.", null);
    }

    private String extractMetaErrorMessage(String responseBody, String defaultMsg) {
        if (!StringUtils.hasText(responseBody)) return defaultMsg;
        try {
            JsonNode json = objectMapper.readTree(responseBody);
            if (json.has("error") && json.get("error").has("message")) {
                int code = json.get("error").has("code") ? json.get("error").get("code").asInt() : 0;
                return String.format("[%d] %s", code, json.get("error").get("message").asText());
            }
        } catch (Exception ignored) {
        }
        return defaultMsg;
    }

    private boolean isConfigured() {
        return StringUtils.hasText(apiToken) && StringUtils.hasText(phoneNumberId);
    }

    @Override
    public String getName() {
        return "MetaWhatsAppProvider";
    }
}
