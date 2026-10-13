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
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@Component
@ConditionalOnProperty(name = "app.notification.provider", havingValue = "twilio")
public class TwilioNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(TwilioNotificationProvider.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.notification.twilio.account-sid:${TWILIO_ACCOUNT_SID:}}")
    private String accountSid;

    @Value("${app.notification.twilio.auth-token:${TWILIO_AUTH_TOKEN:}}")
    private String authToken;

    @Value("${app.notification.twilio.phone-number:${TWILIO_PHONE_NUMBER:}}")
    private String twilioPhoneNumber;

    @Value("${app.notification.twilio.whatsapp-from:${TWILIO_WHATSAPP_FROM:whatsapp:+14155238886}}")
    private String twilioWhatsAppFrom;

    public TwilioNotificationProvider() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public NotificationResult sendWhatsApp(String to, String message) {
        if (!isConfigured()) {
            String err = "BLOCKED: Twilio credentials not configured. Please supply TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.";
            log.warn(err);
            return NotificationResult.failed(err, null);
        }

        String formattedTo = to.startsWith("whatsapp:") ? to : "whatsapp:" + formatPhoneE164(to);
        String formattedFrom = twilioWhatsAppFrom.startsWith("whatsapp:") ? twilioWhatsAppFrom : "whatsapp:" + twilioWhatsAppFrom;

        return executeTwilioSend(formattedTo, formattedFrom, message, "WhatsApp");
    }

    @Override
    public NotificationResult sendSms(String to, String message) {
        if (!isConfigured()) {
            String err = "BLOCKED: Twilio credentials not configured. Please supply TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.";
            log.warn(err);
            return NotificationResult.failed(err, null);
        }

        if (!StringUtils.hasText(twilioPhoneNumber)) {
            String err = "BLOCKED: Twilio SMS sender phone number (TWILIO_PHONE_NUMBER) not configured.";
            log.warn(err);
            return NotificationResult.failed(err, null);
        }

        return executeTwilioSend(formatPhoneE164(to), twilioPhoneNumber, message, "SMS");
    }

    private NotificationResult executeTwilioSend(String to, String from, String body, String channelName) {
        String url = String.format("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSid);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(accountSid, authToken);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("To", to);
            map.add("From", from);
            map.add("Body", body);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                String sid = json.has("sid") ? json.get("sid").asText() : "TWILIO-MSG";
                String status = json.has("status") ? json.get("status").asText() : "SENT";
                log.info("Successfully dispatched live Twilio {} message to {}. Twilio SID: {}, Status: {}", channelName, to, sid, status);
                return NotificationResult.sent(sid, response.getBody());
            } else {
                return NotificationResult.failed("Twilio returned non-2xx status: " + response.getStatusCode(), response.getBody());
            }
        } catch (HttpStatusCodeException ex) {
            String responseBody = ex.getResponseBodyAsString();
            String errorMsg = extractTwilioErrorMessage(responseBody, ex.getMessage());
            log.error("Twilio {} dispatch error (HTTP {}): {}", channelName, ex.getStatusCode(), errorMsg);
            return NotificationResult.failed(errorMsg, responseBody);
        } catch (Exception ex) {
            log.error("Twilio {} unexpected error: {}", channelName, ex.getMessage());
            return NotificationResult.failed(ex.getMessage(), null);
        }
    }

    private String extractTwilioErrorMessage(String responseBody, String defaultMsg) {
        if (!StringUtils.hasText(responseBody)) return defaultMsg;
        try {
            JsonNode json = objectMapper.readTree(responseBody);
            if (json.has("message")) {
                int code = json.has("code") ? json.get("code").asInt() : 0;
                return String.format("[%d] %s", code, json.get("message").asText());
            }
        } catch (Exception ignored) {
        }
        return defaultMsg;
    }

    private String formatPhoneE164(String phone) {
        if (!StringUtils.hasText(phone)) return phone;
        String cleaned = phone.replaceAll("[^0-9+]", "");
        if (!cleaned.startsWith("+")) {
            // Default to India country code +91 if length is 10 digits
            if (cleaned.length() == 10) {
                return "+91" + cleaned;
            }
            return "+" + cleaned;
        }
        return cleaned;
    }

    private boolean isConfigured() {
        return StringUtils.hasText(accountSid) && StringUtils.hasText(authToken);
    }

    @Override
    public String getName() {
        return "TwilioNotificationProvider";
    }
}
