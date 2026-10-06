package com.hardwareshop.service;

import com.hardwareshop.dto.request.LowStockSettingsRequest;
import com.hardwareshop.dto.request.ProductCreateRequest;
import com.hardwareshop.dto.request.StockUpdateRequest;
import com.hardwareshop.dto.response.ProductResponse;
import com.hardwareshop.entity.Product;
import com.hardwareshop.exception.InvalidOperationException;
import com.hardwareshop.exception.ResourceNotFoundException;
import com.hardwareshop.notification.NotificationService;
import com.hardwareshop.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        testProduct = new Product(
                "PVC Pipe",
                "High quality pipe",
                "Plumbing",
                new BigDecimal("150.00"),
                50,
                null,
                10,
                true
        );
        testProduct.setId(1L);
    }

    @Test
    @DisplayName("Should create product successfully with non-negative stock")
    void shouldCreateProductSuccessfully() {
        ProductCreateRequest request = new ProductCreateRequest(
                "Hammer",
                "Steel Hammer",
                "Tools",
                new BigDecimal("400.00"),
                20,
                null,
                5,
                true,
                null
        );

        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(2L);
            return p;
        });

        ProductResponse response = productService.createProduct(request);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Hammer");
        assertThat(response.getAvailableQuantity()).isEqualTo(20);
        assertThat(response.getOutOfStock()).isFalse();
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when product does not exist")
    void shouldThrowExceptionWhenProductNotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Product not found with id: 99");
    }

    @Test
    @DisplayName("Should update stock and prevent stock from becoming negative")
    void shouldPreventNegativeStock() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        StockUpdateRequest invalidRequest = new StockUpdateRequest(-60, "Excess reduction");

        assertThatThrownBy(() -> productService.updateStock(1L, invalidRequest))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Stock cannot be negative");

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("Should trigger low stock alert on manual decrease below threshold and prevent duplicates")
    void shouldTriggerLowStockAlertAndPreventDuplicate() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Decrease stock from 50 to 8 (limit is 10)
        StockUpdateRequest reduceReq = new StockUpdateRequest(-42, "Manual adjustment");
        ProductResponse res1 = productService.updateStock(1L, reduceReq);

        assertThat(res1.getAvailableQuantity()).isEqualTo(8);
        assertThat(testProduct.getLowStockAlertSent()).isTrue();
        verify(notificationService, times(1)).sendLowStockNotification(testProduct);

        // Second decrease from 8 to 5 (still <= 10). Alert must NOT be triggered again (Duplicate protection!)
        StockUpdateRequest secondReduceReq = new StockUpdateRequest(-3, "Further adjustment");
        ProductResponse res2 = productService.updateStock(1L, secondReduceReq);

        assertThat(res2.getAvailableQuantity()).isEqualTo(5);
        // Still called only once!
        verify(notificationService, times(1)).sendLowStockNotification(testProduct);
    }

    @Test
    @DisplayName("Should re-arm low-stock alert when stock is replenished above threshold")
    void shouldRearmLowStockAlertWhenRestocked() {
        testProduct.setAvailableQuantity(8);
        testProduct.setLowStockAlertSent(true);

        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Add 20 stock -> becomes 28 > 10
        StockUpdateRequest restockReq = new StockUpdateRequest(20, "Batch restock");
        ProductResponse res = productService.updateStock(1L, restockReq);

        assertThat(res.getAvailableQuantity()).isEqualTo(28);
        assertThat(testProduct.getLowStockAlertSent()).isFalse(); // Re-armed!
    }

    @Test
    @DisplayName("Should not trigger alert if low-stock notification is disabled")
    void shouldNotAlertWhenNotificationDisabled() {
        testProduct.setLowStockNotificationEnabled(false);
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Decrease stock to 5 <= 10
        StockUpdateRequest reduceReq = new StockUpdateRequest(-45, "Manual deduction");
        productService.updateStock(1L, reduceReq);

        verify(notificationService, never()).sendLowStockNotification(any(Product.class));
    }
}
