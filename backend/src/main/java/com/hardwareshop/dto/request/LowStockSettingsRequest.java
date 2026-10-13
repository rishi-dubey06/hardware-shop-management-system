package com.hardwareshop.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class LowStockSettingsRequest {

    @NotNull(message = "Low-stock limit cannot be null")
    @Min(value = 0, message = "Low-stock limit cannot be negative")
    private Integer lowStockLimit;

    @NotNull(message = "Notification enabled setting cannot be null")
    private Boolean lowStockNotificationEnabled;

    public LowStockSettingsRequest() {
    }

    public LowStockSettingsRequest(Integer lowStockLimit, Boolean lowStockNotificationEnabled) {
        this.lowStockLimit = lowStockLimit;
        this.lowStockNotificationEnabled = lowStockNotificationEnabled;
    }

    public Integer getLowStockLimit() {
        return lowStockLimit;
    }

    public void setLowStockLimit(Integer lowStockLimit) {
        this.lowStockLimit = lowStockLimit;
    }

    public Boolean getLowStockNotificationEnabled() {
        return lowStockNotificationEnabled;
    }

    public void setLowStockNotificationEnabled(Boolean lowStockNotificationEnabled) {
        this.lowStockNotificationEnabled = lowStockNotificationEnabled;
    }
}
