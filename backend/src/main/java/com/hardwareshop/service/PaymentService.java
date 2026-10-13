package com.hardwareshop.service;

import com.hardwareshop.dto.request.PaymentConfirmationRequest;
import com.hardwareshop.dto.response.SaleResponse;
import com.hardwareshop.entity.*;
import com.hardwareshop.exception.InvalidOperationException;
import com.hardwareshop.notification.NotificationService;
import com.hardwareshop.repository.PaymentRepository;
import com.hardwareshop.repository.SaleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final SaleService saleService;

    public PaymentService(SaleRepository saleRepository,
                          PaymentRepository paymentRepository,
                          NotificationService notificationService,
                          SaleService saleService) {
        this.saleRepository = saleRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        this.saleService = saleService;
    }

    /**
     * Requirement 13:
     * Admin confirms manual payment (CASH, UPI, OTHER).
     * Payment status transitions: PENDING -> SUCCESS
     * Triggers customer payment success notification with item names and amount.
     */
    @Transactional
    public SaleResponse confirmPayment(Long saleId, PaymentConfirmationRequest request) {
        Sale sale = saleService.getSaleEntity(saleId);

        if (sale.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new InvalidOperationException("Payment has already been confirmed for sale: " + sale.getBillNumber());
        }

        PaymentMethod method = (request != null && request.getPaymentMethod() != null)
                ? request.getPaymentMethod()
                : sale.getPaymentMethod();

        String ref = request != null ? request.getTransactionReference() : null;
        String notes = request != null ? request.getNotes() : null;

        Payment payment = new Payment(
                sale,
                sale.getTotalAmount(),
                method,
                PaymentStatus.SUCCESS,
                ref,
                LocalDateTime.now(),
                notes
        );
        paymentRepository.save(payment);

        sale.setPaymentStatus(PaymentStatus.SUCCESS);
        sale.setPaymentMethod(method);
        sale = saleRepository.save(sale);

        log.info("Payment confirmed SUCCESS for sale id: {} (Bill: {}). Amount: {}, Method: {}",
                sale.getId(), sale.getBillNumber(), sale.getTotalAmount(), method);

        // Requirement 13: Customer receives payment success notification
        notificationService.sendPaymentSuccessNotification(sale);

        return saleService.mapToResponse(sale);
    }
}
