package com.hardwareshop.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_name", columnList = "name"),
        @Index(name = "idx_products_category", columnList = "category"),
        @Index(name = "idx_products_out_of_stock", columnList = "out_of_stock"),
        @Index(name = "idx_products_low_stock", columnList = "available_quantity")
})
@EntityListeners(AuditingEntityListener.class)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Product name cannot be empty")
    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(length = 60)
    private String category;

    @NotNull(message = "Product price cannot be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull(message = "Available quantity cannot be null")
    @Min(value = 0, message = "Quantity cannot be negative")
    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "out_of_stock", nullable = false)
    private Boolean outOfStock = false;

    @Column(name = "expected_restock_date")
    private LocalDate expectedRestockDate;

    @NotNull(message = "Low-stock limit cannot be null")
    @Min(value = 0, message = "Low-stock limit cannot be negative")
    @Column(name = "low_stock_limit", nullable = false)
    private Integer lowStockLimit = 10;

    @Column(name = "low_stock_notification_enabled", nullable = false)
    private Boolean lowStockNotificationEnabled = true;

    /**
     * Duplicate-alert protection flag:
     * Set to true when an alert is fired so the same product is not repeatedly alerted.
     * Reset to false once stock is replenished above lowStockLimit.
     */
    @Column(name = "low_stock_alert_sent", nullable = false)
    private Boolean lowStockAlertSent = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Product() {
    }

    public Product(String name, String description, String category, BigDecimal price,
                   Integer availableQuantity, String imageUrl, Integer lowStockLimit,
                   Boolean lowStockNotificationEnabled) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.price = price;
        this.availableQuantity = availableQuantity;
        this.imageUrl = imageUrl;
        this.lowStockLimit = lowStockLimit != null ? lowStockLimit : 10;
        this.lowStockNotificationEnabled = lowStockNotificationEnabled != null ? lowStockNotificationEnabled : true;
        this.outOfStock = (availableQuantity == null || availableQuantity <= 0);
        this.lowStockAlertSent = false;
    }

    @PrePersist
    @PreUpdate
    public void syncStockStatus() {
        if (this.availableQuantity == null) {
            this.availableQuantity = 0;
        }
        this.outOfStock = (this.availableQuantity <= 0);
        if (this.lowStockLimit == null) {
            this.lowStockLimit = 10;
        }
        if (this.lowStockNotificationEnabled == null) {
            this.lowStockNotificationEnabled = true;
        }
        if (this.lowStockAlertSent == null) {
            this.lowStockAlertSent = false;
        }
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
        this.outOfStock = (availableQuantity == null || availableQuantity <= 0);
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
