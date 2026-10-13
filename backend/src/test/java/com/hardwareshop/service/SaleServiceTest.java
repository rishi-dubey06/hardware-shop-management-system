package com.hardwareshop.service;

import com.hardwareshop.dto.request.SaleCreateRequest;
import com.hardwareshop.dto.request.SaleItemRequest;
import com.hardwareshop.dto.response.SaleResponse;
import com.hardwareshop.entity.*;
import com.hardwareshop.exception.InsufficientStockException;
import com.hardwareshop.exception.InvalidOperationException;
import com.hardwareshop.notification.NotificationService;
import com.hardwareshop.repository.ProductRepository;
import com.hardwareshop.repository.SaleRepository;
import com.hardwareshop.util.BillNumberGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerService customerService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private BillNumberGenerator billNumberGenerator;

    @InjectMocks
    private SaleService saleService;

    private Customer customer;
    private Product product;
    private Sale sale;

    @BeforeEach
    void setUp() {
        customer = new Customer("Rahul Sharma", "9876543210", "Greater Noida, UP", "rahul@example.com");
        customer.setId(10L);

        product = new Product("PVC Pipe", "High quality", "Plumbing", new BigDecimal("150.00"), 50, null, 10, true);
        product.setId(100L);

        sale = new Sale();
        sale.setId(500L);
        sale.setBillNumber("INV-2026-0001");
        sale.setCustomer(customer);
        sale.setSaleStatus(SaleStatus.PENDING);
        sale.setPaymentStatus(PaymentStatus.PENDING);

        SaleItem item = new SaleItem(product, 5, product.getPrice());
        sale.addItem(item);
        sale.setTotalAmount(new BigDecimal("750.00"));
    }

    @Test
    @DisplayName("Creating pending sale must NOT deduct stock and must NOT trigger purchase notification")
    void creatingPendingSaleShouldNotDeductStockOrNotify() {
        when(customerService.getCustomerEntity(10L)).thenReturn(customer);
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(billNumberGenerator.generateBillNumber()).thenReturn("INV-2026-0001");
        when(saleRepository.save(any(Sale.class))).thenAnswer(i -> {
            Sale s = i.getArgument(0);
            s.setId(500L);
            return s;
        });

        SaleCreateRequest request = new SaleCreateRequest(
                10L,
                Collections.singletonList(new SaleItemRequest(100L, 5)),
                PaymentMethod.CASH,
                "Pending sale test"
        );

        SaleResponse response = saleService.createPendingSale(request);

        assertThat(response.getSaleStatus()).isEqualTo(SaleStatus.PENDING);
        assertThat(product.getAvailableQuantity()).isEqualTo(50); // Stock unchanged!
        verify(notificationService, never()).sendPurchaseNotification(any());
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("SELL operation should deduct stock, mark CONFIRMED, and trigger purchase notification")
    void sellOperationShouldDeductStockAndNotify() {
        when(saleRepository.findById(500L)).thenReturn(Optional.of(sale));
        when(saleRepository.save(any(Sale.class))).thenAnswer(i -> i.getArgument(0));

        SaleResponse response = saleService.confirmSale(500L);

        assertThat(response.getSaleStatus()).isEqualTo(SaleStatus.CONFIRMED);
        assertThat(product.getAvailableQuantity()).isEqualTo(45); // 50 - 5 = 45
        verify(productRepository, times(1)).save(product);
        verify(notificationService, times(1)).sendPurchaseNotification(sale);
    }

    @Test
    @DisplayName("SELL operation must fail and rollback if stock is insufficient")
    void sellOperationShouldFailWhenStockInsufficient() {
        product.setAvailableQuantity(3); // Requested 5, available 3

        when(saleRepository.findById(500L)).thenReturn(Optional.of(sale));

        assertThatThrownBy(() -> saleService.confirmSale(500L))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Insufficient stock for product PVC Pipe");

        assertThat(sale.getSaleStatus()).isEqualTo(SaleStatus.PENDING); // Unchanged
        verify(notificationService, never()).sendPurchaseNotification(any());
    }

    @Test
    @DisplayName("Duplicate SELL operation on already confirmed sale must be rejected")
    void duplicateSellOperationMustBeRejected() {
        sale.setSaleStatus(SaleStatus.CONFIRMED);
        when(saleRepository.findById(500L)).thenReturn(Optional.of(sale));

        assertThatThrownBy(() -> saleService.confirmSale(500L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Sale cannot be confirmed. Current status is CONFIRMED");
    }

    @Test
    @DisplayName("SELL operation causing stock <= lowStockLimit must trigger low-stock alert")
    void sellOperationBreachingLowStockThresholdShouldTriggerAlert() {
        product.setAvailableQuantity(12); // Limit is 10, buy 5 -> becomes 7 <= 10
        product.setLowStockLimit(10);
        product.setLowStockNotificationEnabled(true);
        product.setLowStockAlertSent(false);

        when(saleRepository.findById(500L)).thenReturn(Optional.of(sale));
        when(saleRepository.save(any(Sale.class))).thenAnswer(i -> i.getArgument(0));

        saleService.confirmSale(500L);

        assertThat(product.getAvailableQuantity()).isEqualTo(7);
        assertThat(product.getLowStockAlertSent()).isTrue();
        verify(notificationService, times(1)).sendLowStockNotification(product);
    }
}
