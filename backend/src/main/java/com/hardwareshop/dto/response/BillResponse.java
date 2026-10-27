package com.hardwareshop.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class BillResponse {

    private Long saleId;
    private String shopName;
    private String shopContact;
    private String shopAddress;
    private String shopGstin;
    private String shopState;
    private String billNumber;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private LocalDate saleDate;
    private LocalTime saleTime;
    private List<SaleItemResponse> items = new ArrayList<>();
    private BigDecimal totalAmount;
    private BigDecimal subtotalAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private String totalInWords;
    private String formattedTotal;
    private String paymentMethod;
    private String paymentStatus;
    private String printableReceiptText;
    private String whatsappShareUrl;
    private String smsShareUrl;

    public BillResponse() {
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public String getShopName() {
        return shopName;
    }

    public void setShopName(String shopName) {
        this.shopName = shopName;
    }

    public String getShopContact() {
        return shopContact;
    }

    public void setShopContact(String shopContact) {
        this.shopContact = shopContact;
    }

    public String getShopAddress() {
        return shopAddress;
    }

    public void setShopAddress(String shopAddress) {
        this.shopAddress = shopAddress;
    }

    public String getShopGstin() {
        return shopGstin;
    }

    public void setShopGstin(String shopGstin) {
        this.shopGstin = shopGstin;
    }

    public String getShopState() {
        return shopState;
    }

    public void setShopState(String shopState) {
        this.shopState = shopState;
    }

    public String getBillNumber() {
        return billNumber;
    }

    public void setBillNumber(String billNumber) {
        this.billNumber = billNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerAddress() {
        return customerAddress;
    }

    public void setCustomerAddress(String customerAddress) {
        this.customerAddress = customerAddress;
    }

    public LocalDate getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDate saleDate) {
        this.saleDate = saleDate;
    }

    public LocalTime getSaleTime() {
        return saleTime;
    }

    public void setSaleTime(LocalTime saleTime) {
        this.saleTime = saleTime;
    }

    public List<SaleItemResponse> getItems() {
        return items;
    }

    public void setItems(List<SaleItemResponse> items) {
        this.items = items;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getSubtotalAmount() {
        return subtotalAmount;
    }

    public void setSubtotalAmount(BigDecimal subtotalAmount) {
        this.subtotalAmount = subtotalAmount;
    }

    public BigDecimal getCgstAmount() {
        return cgstAmount;
    }

    public void setCgstAmount(BigDecimal cgstAmount) {
        this.cgstAmount = cgstAmount;
    }

    public BigDecimal getSgstAmount() {
        return sgstAmount;
    }

    public void setSgstAmount(BigDecimal sgstAmount) {
        this.sgstAmount = sgstAmount;
    }

    public String getTotalInWords() {
        return totalInWords;
    }

    public void setTotalInWords(String totalInWords) {
        this.totalInWords = totalInWords;
    }

    public String getFormattedTotal() {
        return formattedTotal;
    }

    public void setFormattedTotal(String formattedTotal) {
        this.formattedTotal = formattedTotal;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPrintableReceiptText() {
        return printableReceiptText;
    }

    public void setPrintableReceiptText(String printableReceiptText) {
        this.printableReceiptText = printableReceiptText;
    }

    public String getWhatsappShareUrl() {
        return whatsappShareUrl;
    }

    public void setWhatsappShareUrl(String whatsappShareUrl) {
        this.whatsappShareUrl = whatsappShareUrl;
    }

    public String getSmsShareUrl() {
        return smsShareUrl;
    }

    public void setSmsShareUrl(String smsShareUrl) {
        this.smsShareUrl = smsShareUrl;
    }
}
