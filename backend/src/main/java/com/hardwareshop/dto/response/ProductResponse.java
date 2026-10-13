package com.hardwareshop.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private String category;
    private BigDecimal price;
    private Integer availableQuantity;
    private String imageUrl;
    private Boolean outOfStock;
    private LocalDate expectedRestockDate;
    private Integer lowStockLimit;
    private Boolean lowStockNotificationEnabled;
    private Boolean lowStockAlertSent;
    private String stockStatus; // AVAILABLE, LOW_STOCK, OUT_OF_STOCK
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProductResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getOutOfStock() {
        return outOfStock;
    }

    public void setOutOfStock(Boolean outOfStock) {
        this.outOfStock = outOfStock;
    }

    public LocalDate getExpectedRestockDate() {
        return expectedRestockDate;
    }

    public void setExpectedRestockDate(LocalDate expectedRestockDate) {
        this.expectedRestockDate = expectedRestockDate;
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

    public Boolean getLowStockAlertSent() {
        return lowStockAlertSent;
    }

    public void setLowStockAlertSent(Boolean lowStockAlertSent) {
        this.lowStockAlertSent = lowStockAlertSent;
    }

    public String getStockStatus() {
        return stockStatus;
    }

    public void setStockStatus(String stockStatus) {
        this.stockStatus = stockStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
