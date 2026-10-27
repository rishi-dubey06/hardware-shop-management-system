package com.hardwareshop.dto.response;

import java.math.BigDecimal;

public class SaleItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productCategory;
    private String hsnCode;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;

    public SaleItemResponse() {
    }

    public SaleItemResponse(Long id, Long productId, String productName, String productCategory,
                            Integer quantity, BigDecimal unitPrice, BigDecimal subtotal) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.productCategory = productCategory;
        this.hsnCode = resolveHsnCode(productCategory);
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
    }

    public SaleItemResponse(Long id, Long productId, String productName, String productCategory,
                            String hsnCode, Integer quantity, BigDecimal unitPrice, BigDecimal subtotal) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.productCategory = productCategory;
        this.hsnCode = hsnCode != null ? hsnCode : resolveHsnCode(productCategory);
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
    }

    public static String resolveHsnCode(String category) {
        if (category == null) return "7326";
        String lower = category.toLowerCase().trim();
        if (lower.contains("pipe") || lower.contains("plumb")) return "3917";
        if (lower.contains("fastener") || lower.contains("screw") || lower.contains("bolt") || lower.contains("nail")) return "7318";
        if (lower.contains("tool")) return "8205";
        if (lower.contains("electric") || lower.contains("wire") || lower.contains("switch")) return "8544";
        if (lower.contains("paint") || lower.contains("primer") || lower.contains("color")) return "3208";
        if (lower.contains("valve") || lower.contains("tap") || lower.contains("sanitary") || lower.contains("faucet")) return "8481";
        if (lower.contains("cement") || lower.contains("putty") || lower.contains("building")) return "2523";
        return "7326"; // Default standard hardware article HSN
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductCategory() {
        return productCategory;
    }

    public void setProductCategory(String productCategory) {
        this.productCategory = productCategory;
    }

    public String getHsnCode() {
        return hsnCode != null ? hsnCode : resolveHsnCode(productCategory);
    }

    public void setHsnCode(String hsnCode) {
        this.hsnCode = hsnCode;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
