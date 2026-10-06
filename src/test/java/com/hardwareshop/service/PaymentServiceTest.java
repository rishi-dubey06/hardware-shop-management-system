package com.hardwareshop.service;

import com.hardwareshop.dto.request.PaymentConfirmationRequest;
import com.hardwareshop.dto.response.SaleResponse;
import com.hardwareshop.entity.*;
import com.hardwareshop.exception.InvalidOperationException;
import com.hardwareshop.notification.NotificationService;
import com.hardwareshop.repository.PaymentRepository;
import com.hardwareshop.repository.SaleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SaleService saleService;

    @InjectMocks
    private PaymentService paymentService;

    private Sale sale;

    @BeforeEach
    void setUp() {
        Customer customer = new Customer("Rahul Sharma", "9876543210", "Greater Noida, UP", "rahul@example.com");
        sale = new Sale();
        sale.setId(10L);
        sale.setBillNumber("INV-2026-0001");
        sale.setCustomer(customer);
        sale.setSaleStatus(SaleStatus.CONFIRMED);
        sale.setPaymentStatus(PaymentStatus.PENDING);
        sale.setTotalAmount(new BigDecimal("1550.00"));
    }

    @Test
    @DisplayName("Confirming payment should mark SUCCESS, persist payment, and trigger notification")
    void shouldConfirmPaymentSuccessfully() {
        when(saleService.getSaleEntity(10L)).thenReturn(sale);
        when(saleRepository.save(any(Sale.class))).thenAnswer(i -> i.getArgument(0));

        SaleResponse expectedResponse = new SaleResponse();
        expectedResponse.setId(10L);
        expectedResponse.setPaymentStatus(PaymentStatus.SUCCESS);
        when(saleService.mapToResponse(any(Sale.class))).thenReturn(expectedResponse);

        PaymentConfirmationRequest req = new PaymentConfirmationRequest(PaymentMethod.UPI, "UPI/2026/9876", "Paid via GooglePay");
        SaleResponse res = paymentService.confirmPayment(10L, req);

        assertThat(res.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        verify(paymentRepository, times(1)).save(any(Payment.class));
        verify(notificationService, times(1)).sendPaymentSuccessNotification(sale);
    }

    @Test
    @DisplayName("Confirming payment on an already successful payment should be rejected")
    void shouldRejectDuplicatePaymentConfirmation() {
        sale.setPaymentStatus(PaymentStatus.SUCCESS);
        when(saleService.getSaleEntity(10L)).thenReturn(sale);

        PaymentConfirmationRequest req = new PaymentConfirmationRequest(PaymentMethod.CASH, null, null);

        assertThatThrownBy(() -> paymentService.confirmPayment(10L, req))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Payment has already been confirmed");

        verify(paymentRepository, never()).save(any());
        verify(notificationService, never()).sendPaymentSuccessNotification(any());
    }
}
