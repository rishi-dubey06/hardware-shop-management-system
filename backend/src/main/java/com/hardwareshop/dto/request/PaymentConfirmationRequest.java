package com.hardwareshop.dto.request;

import com.hardwareshop.entity.PaymentMethod;

public class PaymentConfirmationRequest {

    private PaymentMethod paymentMethod;
    private String transactionReference;
    private String notes;

    public PaymentConfirmationRequest() {
    }

    public PaymentConfirmationRequest(PaymentMethod paymentMethod, String transactionReference, String notes) {
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.notes = notes;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
