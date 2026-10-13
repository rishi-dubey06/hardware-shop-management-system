package com.hardwareshop.notification;

public record NotificationResult(
        boolean success,
        String status, // SENT, FAILED, SIMULATED
        String providerMessageId,
        String errorMessage,
        String rawResponse
) {
    public static NotificationResult sent(String providerMessageId, String rawResponse) {
        return new NotificationResult(true, "SENT", providerMessageId, null, rawResponse);
    }

    public static NotificationResult simulated(String providerMessageId, String note) {
        return new NotificationResult(true, "SIMULATED", providerMessageId, null, note);
    }

    public static NotificationResult failed(String errorMessage, String rawResponse) {
        return new NotificationResult(false, "FAILED", null, errorMessage, rawResponse);
    }
}
