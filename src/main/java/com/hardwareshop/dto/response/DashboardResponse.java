package com.hardwareshop.dto.response;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DashboardResponse {

    // Inventory
    private long totalProducts;
    private long totalStock;
    private long lowStockCount;
    private long outOfStockCount;

    // Sales
    private long todaySalesCount;
    private BigDecimal todaySalesAmount;
    private long totalSalesCount;
    private BigDecimal totalSalesAmount;
    private long pendingSalesCount;
    private long confirmedSalesCount;

    // Payments
    private long pendingPaymentsCount;
    private long successfulPaymentsCount;
    private BigDecimal totalPaidAmount;

    // Customers
    private long totalCustomersCount;

    // Alerts and lists
    private List<ProductResponse> lowStockProducts = new ArrayList<>();
    private List<ProductResponse> outOfStockProducts = new ArrayList<>();
    private List<SaleResponse> recentSales = new ArrayList<>();
    private List<CustomerResponse> recentCustomers = new ArrayList<>();

    public DashboardResponse() {
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTotalStock() {
        return totalStock;
    }

    public void setTotalStock(long totalStock) {
        this.totalStock = totalStock;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getOutOfStockCount() {
        return outOfStockCount;
    }

    public void setOutOfStockCount(long outOfStockCount) {
        this.outOfStockCount = outOfStockCount;
    }

    public long getTodaySalesCount() {
        return todaySalesCount;
    }

    public void setTodaySalesCount(long todaySalesCount) {
        this.todaySalesCount = todaySalesCount;
    }

    public BigDecimal getTodaySalesAmount() {
        return todaySalesAmount;
    }

    public void setTodaySalesAmount(BigDecimal todaySalesAmount) {
        this.todaySalesAmount = todaySalesAmount;
    }

    public long getTotalSalesCount() {
        return totalSalesCount;
    }

    public void setTotalSalesCount(long totalSalesCount) {
        this.totalSalesCount = totalSalesCount;
    }

    public BigDecimal getTotalSalesAmount() {
        return totalSalesAmount;
    }

    public void setTotalSalesAmount(BigDecimal totalSalesAmount) {
        this.totalSalesAmount = totalSalesAmount;
    }

    public long getPendingSalesCount() {
        return pendingSalesCount;
    }

    public void setPendingSalesCount(long pendingSalesCount) {
        this.pendingSalesCount = pendingSalesCount;
    }

    public long getConfirmedSalesCount() {
        return confirmedSalesCount;
    }

    public void setConfirmedSalesCount(long confirmedSalesCount) {
        this.confirmedSalesCount = confirmedSalesCount;
    }

    public long getPendingPaymentsCount() {
        return pendingPaymentsCount;
    }

    public void setPendingPaymentsCount(long pendingPaymentsCount) {
        this.pendingPaymentsCount = pendingPaymentsCount;
    }

    public long getSuccessfulPaymentsCount() {
        return successfulPaymentsCount;
    }

    public void setSuccessfulPaymentsCount(long successfulPaymentsCount) {
        this.successfulPaymentsCount = successfulPaymentsCount;
    }

    public BigDecimal getTotalPaidAmount() {
        return totalPaidAmount;
    }

    public void setTotalPaidAmount(BigDecimal totalPaidAmount) {
        this.totalPaidAmount = totalPaidAmount;
    }

    public long getTotalCustomersCount() {
        return totalCustomersCount;
    }

    public void setTotalCustomersCount(long totalCustomersCount) {
        this.totalCustomersCount = totalCustomersCount;
    }

    public List<ProductResponse> getLowStockProducts() {
        return lowStockProducts;
    }

    public void setLowStockProducts(List<ProductResponse> lowStockProducts) {
        this.lowStockProducts = lowStockProducts;
    }

    public List<ProductResponse> getOutOfStockProducts() {
        return outOfStockProducts;
    }

    public void setOutOfStockProducts(List<ProductResponse> outOfStockProducts) {
        this.outOfStockProducts = outOfStockProducts;
    }

    public List<SaleResponse> getRecentSales() {
        return recentSales;
    }

    public void setRecentSales(List<SaleResponse> recentSales) {
        this.recentSales = recentSales;
    }

    public List<CustomerResponse> getRecentCustomers() {
        return recentCustomers;
    }

    public void setRecentCustomers(List<CustomerResponse> recentCustomers) {
        this.recentCustomers = recentCustomers;
    }
}
