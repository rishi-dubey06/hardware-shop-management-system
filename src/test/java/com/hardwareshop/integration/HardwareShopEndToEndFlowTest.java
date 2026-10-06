package com.hardwareshop.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hardwareshop.dto.request.LowStockSettingsRequest;
import com.hardwareshop.dto.request.PaymentConfirmationRequest;
import com.hardwareshop.dto.request.SaleCreateRequest;
import com.hardwareshop.dto.request.SaleItemRequest;
import com.hardwareshop.entity.*;
import com.hardwareshop.notification.NotificationService;
import com.hardwareshop.repository.CustomerRepository;
import com.hardwareshop.repository.PaymentRepository;
import com.hardwareshop.repository.ProductRepository;
import com.hardwareshop.repository.SaleRepository;
import com.hardwareshop.service.PaymentService;
import com.hardwareshop.service.ProductService;
import com.hardwareshop.service.SaleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HardwareShopEndToEndFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private SaleService saleService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ProductService productService;

    @MockBean
    private NotificationService notificationService;

    private Product testPvcPipe;
    private Customer testCustomer;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        saleRepository.deleteAll();
        productRepository.deleteAll();
        customerRepository.deleteAll();

        // Product Stock = 50, Low-stock limit = 10, Notifications enabled
        testPvcPipe = new Product(
                "PVC Pipe",
                "10ft pipe",
                "Plumbing",
                new BigDecimal("150.00"),
                50,
                null,
                10,
                true
        );
        testPvcPipe = productRepository.save(testPvcPipe);

        testCustomer = new Customer(
                "Rahul Sharma",
                "9876543210",
                "Greater Noida, UP",
                "rahul@example.com"
        );
        testCustomer = customerRepository.save(testCustomer);
    }

    /**
     * Requirement 23: Complete Automated Scenario:
     * Product Stock = 50
     * Customer purchases 5
     * Pending Sale Created
     * Stock remains = 50
     * Admin clicks SELL
     * Sale becomes CONFIRMED
     * Stock becomes = 45
     * Customer purchase notification is triggered
     * Admin confirms payment
     * Payment becomes SUCCESS
     * Customer payment-success notification is triggered
     */
    @Test
    @DisplayName("Execute Requirement 23 complete lifecycle scenario")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void testCompleteAutomatedScenario() throws Exception {
        // Step 1: Initial Stock = 50
        assertThat(productRepository.findById(testPvcPipe.getId()).get().getAvailableQuantity())
                .isEqualTo(50);

        // Step 2 & 3: Customer purchases 5 -> Pending Sale Created
        SaleCreateRequest saleRequest = new SaleCreateRequest();
        saleRequest.setCustomerId(testCustomer.getId());
        saleRequest.setPaymentMethod(PaymentMethod.UPI);
        saleRequest.setItems(Collections.singletonList(
                new SaleItemRequest(testPvcPipe.getId(), 5)
        ));

        String createSaleResponse = mockMvc.perform(post("/api/admin/sales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saleRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.saleStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.paymentStatus").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        Long saleId = objectMapper.readTree(createSaleResponse).path("data").path("id").asLong();

        // Step 4: Verify stock remains 50 while sale is PENDING
        Product stockAfterPending = productRepository.findById(testPvcPipe.getId()).get();
        assertThat(stockAfterPending.getAvailableQuantity()).isEqualTo(50);
        // Verify purchase notification has NOT been triggered yet
        verify(notificationService, never()).sendPurchaseNotification(any());

        // Step 5 & 6 & 7: Admin clicks SELL -> Sale CONFIRMED, Stock becomes 45, Purchase notification triggered
        mockMvc.perform(post("/api/admin/sales/" + saleId + "/sell"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.saleStatus").value("CONFIRMED"));

        Product stockAfterSell = productRepository.findById(testPvcPipe.getId()).get();
        assertThat(stockAfterSell.getAvailableQuantity()).isEqualTo(45); // 50 - 5 = 45
        verify(notificationService, times(1)).sendPurchaseNotification(any());

        // Step 8 & 9 & 10: Admin confirms payment -> Payment becomes SUCCESS, Customer payment-success notification triggered
        PaymentConfirmationRequest payReq = new PaymentConfirmationRequest(PaymentMethod.UPI, "UPI-REF-9988", "Paid via QR");

        mockMvc.perform(post("/api/admin/sales/" + saleId + "/confirm-payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentStatus").value("SUCCESS"));

        Sale finalizedSale = saleRepository.findById(saleId).get();
        assertThat(finalizedSale.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        verify(notificationService, times(1)).sendPaymentSuccessNotification(any());
    }

    @Test
    @DisplayName("Verify low-stock alert is generated when stock reaches threshold and notification is enabled")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void testLowStockAlertWhenThresholdReachedAndEnabled() throws Exception {
        // Set Product stock = 10, lowStockLimit = 10, notification = ENABLED
        testPvcPipe.setAvailableQuantity(10);
        testPvcPipe.setLowStockLimit(10);
        testPvcPipe.setLowStockNotificationEnabled(true);
        testPvcPipe.setLowStockAlertSent(false);
        productRepository.save(testPvcPipe);

        // Create sale for 1 item
        SaleCreateRequest saleRequest = new SaleCreateRequest();
        saleRequest.setCustomerId(testCustomer.getId());
        saleRequest.setItems(Collections.singletonList(new SaleItemRequest(testPvcPipe.getId(), 1)));

        var pendingSale = saleService.createPendingSale(saleRequest);

        // Click SELL
        saleService.confirmSale(pendingSale.getId());

        // Stock is now 9 <= 10 -> Low stock notification must be triggered
        Product updatedProduct = productRepository.findById(testPvcPipe.getId()).get();
        assertThat(updatedProduct.getAvailableQuantity()).isEqualTo(9);
        assertThat(updatedProduct.getLowStockAlertSent()).isTrue();
        verify(notificationService, times(1)).sendLowStockNotification(any(Product.class));
    }

    @Test
    @DisplayName("Verify NO low-stock alert is sent when notification is disabled")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void testNoLowStockAlertWhenNotificationDisabled() throws Exception {
        // Disable notifications
        testPvcPipe.setAvailableQuantity(15);
        testPvcPipe.setLowStockLimit(10);
        testPvcPipe.setLowStockNotificationEnabled(false);
        testPvcPipe.setLowStockAlertSent(false);
        productRepository.save(testPvcPipe);

        // Sale of 10 items brings stock to 5 <= 10
        SaleCreateRequest saleRequest = new SaleCreateRequest();
        saleRequest.setCustomerId(testCustomer.getId());
        saleRequest.setItems(Collections.singletonList(new SaleItemRequest(testPvcPipe.getId(), 10)));

        var pendingSale = saleService.createPendingSale(saleRequest);
        saleService.confirmSale(pendingSale.getId());

        Product updatedProduct = productRepository.findById(testPvcPipe.getId()).get();
        assertThat(updatedProduct.getAvailableQuantity()).isEqualTo(5);
        verify(notificationService, never()).sendLowStockNotification(any(Product.class));
    }

    @Test
    @DisplayName("Verify CUSTOMER role cannot access ADMIN endpoints (403 Forbidden)")
    @WithMockUser(username = "customer", roles = {"CUSTOMER"})
    void testCustomerCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/sales"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Verify anonymous user can access public product catalog")
    void testPublicCanAccessProductCatalog() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
