package com.hardwareshop.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ProductCreateRequest {

    @NotBlank(message = "Product name cannot be empty")
    private String name;

    private String description;

    private String category;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
    private BigDecimal price;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer availableQuantity;

    private String imageUrl;

    @Min(value = 0, message = "Low-stock limit cannot be negative")
    private Integer lowStockLimit = 10;

    private Boolean lowStockNotificationEnabled = true;

    private LocalDate expectedRestockDate;

    public ProductCreateRequest() {
    }

    public ProductCreateRequest(String name, String description, String category, BigDecimal price,
                                Integer availableQuantity, String imageUrl, Integer lowStockLimit,
                                Boolean lowStockNotificationEnabled, LocalDate expectedRestockDate) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.price = price;
        this.availableQuantity = availableQuantity;
        this.imageUrl = imageUrl;
        this.lowStockLimit = lowStockLimit != null ? lowStockLimit : 10;
        this.lowStockNotificationEnabled = lowStockNotificationEnabled != null ? lowStockNotificationEnabled : true;
        this.expectedRestockDate = expectedRestockDate;
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

    public LocalDate getExpectedRestockDate() {
        return expectedRestockDate;
    }

    public void setExpectedRestockDate(LocalDate expectedRestockDate) {
        this.expectedRestockDate = expectedRestockDate;
    }
}
