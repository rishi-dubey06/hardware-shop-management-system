package com.hardwareshop.dto.request;

import jakarta.validation.constraints.NotNull;

public class StockUpdateRequest {

    @NotNull(message = "Quantity change is required")
    private Integer quantityChange; // Positive to add stock, negative to reduce

    private String reason;

    public StockUpdateRequest() {
    }

    public StockUpdateRequest(Integer quantityChange, String reason) {
        this.quantityChange = quantityChange;
        this.reason = reason;
    }

    public Integer getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(Integer quantityChange) {
        this.quantityChange = quantityChange;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
