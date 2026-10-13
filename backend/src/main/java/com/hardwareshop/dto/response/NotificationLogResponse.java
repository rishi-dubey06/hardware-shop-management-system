package com.hardwareshop.dto.response;

import com.hardwareshop.entity.NotificationChannel;
import com.hardwareshop.entity.NotificationType;

import java.time.LocalDateTime;

public class NotificationLogResponse {

    private Long id;
    private String recipient;
    private NotificationChannel channel;
    private NotificationType notificationType;
    private String message;
    private String status;
    private String providerMessageId;
    private String errorMessage;
    private String providerResponse;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;

    public NotificationLogResponse() {
    }

    public NotificationLogResponse(Long id, String recipient, NotificationChannel channel,
                                   NotificationType notificationType, String message,
                                   String status, String providerMessageId, String errorMessage,
                                   String providerResponse, LocalDateTime sentAt, LocalDateTime createdAt) {
        this.id = id;
        this.recipient = recipient;
        this.channel = channel;
        this.notificationType = notificationType;
        this.message = message;
        this.status = status;
        this.providerMessageId = providerMessageId;
        this.errorMessage = errorMessage;
        this.providerResponse = providerResponse;
        this.sentAt = sentAt;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(NotificationType notificationType) {
        this.notificationType = notificationType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProviderMessageId() {
        return providerMessageId;
    }

    public void setProviderMessageId(String providerMessageId) {
        this.providerMessageId = providerMessageId;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getProviderResponse() {
        return providerResponse;
    }

    public void setProviderResponse(String providerResponse) {
        this.providerResponse = providerResponse;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
