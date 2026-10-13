package com.hardwareshop.service;

import com.hardwareshop.dto.request.CustomerRequest;
import com.hardwareshop.dto.request.SaleCreateRequest;
import com.hardwareshop.dto.request.SaleItemRequest;
import com.hardwareshop.dto.response.SaleItemResponse;
import com.hardwareshop.dto.response.SaleResponse;
import com.hardwareshop.entity.*;
import com.hardwareshop.exception.InsufficientStockException;
import com.hardwareshop.exception.InvalidOperationException;
import com.hardwareshop.exception.ResourceNotFoundException;
import com.hardwareshop.notification.NotificationService;
import com.hardwareshop.repository.ProductRepository;
import com.hardwareshop.repository.SaleRepository;
import com.hardwareshop.util.BillNumberGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SaleService {

    private static final Logger log = LoggerFactory.getLogger(SaleService.class);

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final CustomerService customerService;
    private final NotificationService notificationService;
    private final BillNumberGenerator billNumberGenerator;

    public SaleService(SaleRepository saleRepository,
                       ProductRepository productRepository,
                       CustomerService customerService,
                       NotificationService notificationService,
                       BillNumberGenerator billNumberGenerator) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.customerService = customerService;
        this.notificationService = notificationService;
        this.billNumberGenerator = billNumberGenerator;
    }

    /**
     * Requirement 9:
     * When Admin creates a purchase, it is initially a PENDING SALE.
     * STOCK MUST NOT BE REDUCED.
     * FINAL CUSTOMER PURCHASE NOTIFICATION MUST NOT BE SENT.
     */
    @Transactional
    public SaleResponse createPendingSale(SaleCreateRequest request) {
        Customer customer;
        if (request.getCustomerId() != null) {
            customer = customerService.getCustomerEntity(request.getCustomerId());
        } else {
            CustomerRequest customerReq = new CustomerRequest(
                    request.getCustomerName(),
                    request.getCustomerPhone(),
                    request.getCustomerAddress(),
                    request.getCustomerEmail()
            );
            customer = customerService.findOrCreateCustomer(customerReq);
        }

        Sale sale = new Sale();
        sale.setBillNumber(billNumberGenerator.generateBillNumber());
        sale.setCustomer(customer);
        sale.setSaleDate(LocalDate.now());
        sale.setSaleTime(LocalTime.now());
        sale.setSaleStatus(SaleStatus.PENDING);
        sale.setPaymentStatus(PaymentStatus.PENDING);
        sale.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH);
        sale.setNotes(request.getNotes());

        BigDecimal total = BigDecimal.ZERO;
        for (SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            // Snapshot the current unit price into the sale item
            SaleItem item = new SaleItem(product, itemReq.getQuantity(), product.getPrice());
            sale.addItem(item);
            total = total.add(item.getSubtotal());
        }

        sale.setTotalAmount(total);
        sale = saleRepository.save(sale);

        log.info("Created PENDING sale id: {} (Bill: {}) for customer '{}'. Total: {}. Stock untouched.",
                sale.getId(), sale.getBillNumber(), customer.getName(), total);

        return mapToResponse(sale);
    }

    /**
     * Requirement 10:
     * SELL OPERATION (Admin clicks SELL)
     * Step 1: Validate sale exists
     * Step 2: Validate sale is still PENDING
     * Step 3: Check product stock for all items
     * Step 4: Reduce stock safely in transaction
     * Step 5: Mark sale as CONFIRMED
     * Step 6: Finalize bill
     * Step 7: Trigger customer purchase notification
     * Step 8: Check low-stock conditions
     */
    @Transactional
    public SaleResponse confirmSale(Long saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + saleId));

        if (sale.getSaleStatus() != SaleStatus.PENDING) {
            throw new InvalidOperationException("Sale cannot be confirmed. Current status is " + sale.getSaleStatus());
        }

        // Step 3: Verify all items have sufficient stock before altering any inventory
        for (SaleItem item : sale.getItems()) {
            Product product = item.getProduct();
            if (product.getAvailableQuantity() < item.getQuantity()) {
                log.warn("Sale confirmation failed: Insufficient stock for product '{}'. Available: {}, Requested: {}",
                        product.getName(), product.getAvailableQuantity(), item.getQuantity());
                throw new InsufficientStockException("Insufficient stock for product " + product.getName() +
                        ". Available: " + product.getAvailableQuantity() + ", Requested: " + item.getQuantity());
            }
        }

        // Step 4 & Step 8: Deduct stock and evaluate low-stock alert conditions
        List<Product> productsToAlert = new ArrayList<>();
        for (SaleItem item : sale.getItems()) {
            Product product = item.getProduct();
            int newQuantity = product.getAvailableQuantity() - item.getQuantity();
            product.setAvailableQuantity(newQuantity);

            // Check low-stock threshold with duplicate-alert protection
            if (newQuantity <= product.getLowStockLimit()) {
                if (Boolean.TRUE.equals(product.getLowStockNotificationEnabled()) &&
                        !Boolean.TRUE.equals(product.getLowStockAlertSent())) {
                    productsToAlert.add(product);
                    product.setLowStockAlertSent(true);
                }
            }

            productRepository.save(product);
            log.info("Deducted {} units from product '{}'. Remaining stock: {}",
                    item.getQuantity(), product.getName(), newQuantity);
        }

        // Step 5 & 6: Finalize bill and mark CONFIRMED
        sale.setSaleStatus(SaleStatus.CONFIRMED);
        sale.setSaleDate(LocalDate.now());
        sale.setSaleTime(LocalTime.now());
        sale = saleRepository.save(sale);

        log.info("Sale id: {} (Bill: {}) CONFIRMED. Inventory deducted.", sale.getId(), sale.getBillNumber());

        // Step 7: Trigger customer purchase notification
        notificationService.sendPurchaseNotification(sale);

        // Step 8: Trigger low stock alerts for products that breached threshold
        for (Product product : productsToAlert) {
            notificationService.sendLowStockNotification(product);
        }

        return mapToResponse(sale);
    }

    public Page<SaleResponse> getAllSales(SaleStatus saleStatus, PaymentStatus paymentStatus, Pageable pageable) {
        return saleRepository.findSalesFiltered(saleStatus, paymentStatus, pageable)
                .map(this::mapToResponse);
    }

    public Page<SaleResponse> getPendingSales(Pageable pageable) {
        return saleRepository.findBySaleStatus(SaleStatus.PENDING, pageable)
                .map(this::mapToResponse);
    }

    public SaleResponse getSaleById(Long id) {
        Sale sale = getSaleEntity(id);
        return mapToResponse(sale);
    }

    public Sale getSaleEntity(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));
    }

    public List<SaleResponse> getCustomerSales(Long customerId) {
        return saleRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SaleResponse mapToResponse(Sale sale) {
        SaleResponse res = new SaleResponse();
        res.setId(sale.getId());
        res.setBillNumber(sale.getBillNumber());
        if (sale.getCustomer() != null) {
            res.setCustomerId(sale.getCustomer().getId());
            res.setCustomerName(sale.getCustomer().getName());
            res.setCustomerPhone(sale.getCustomer().getPhoneNumber());
            res.setCustomerAddress(sale.getCustomer().getAddress());
        }
        res.setSaleDate(sale.getSaleDate());
        res.setSaleTime(sale.getSaleTime());
        res.setTotalAmount(sale.getTotalAmount());
        res.setSaleStatus(sale.getSaleStatus());
        res.setPaymentStatus(sale.getPaymentStatus());
        res.setPaymentMethod(sale.getPaymentMethod());
        res.setNotes(sale.getNotes());
        res.setCreatedAt(sale.getCreatedAt());
        res.setUpdatedAt(sale.getUpdatedAt());

        List<SaleItemResponse> items = new ArrayList<>();
        if (sale.getItems() != null) {
            for (SaleItem item : sale.getItems()) {
                SaleItemResponse itemRes = new SaleItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getCategory(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                );
                items.add(itemRes);
            }
        }
        res.setItems(items);

        return res;
    }
}
