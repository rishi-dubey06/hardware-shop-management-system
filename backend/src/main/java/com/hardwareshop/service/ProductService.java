package com.hardwareshop.service;

import com.hardwareshop.dto.request.LowStockSettingsRequest;
import com.hardwareshop.dto.request.ProductCreateRequest;
import com.hardwareshop.dto.request.ProductUpdateRequest;
import com.hardwareshop.dto.request.StockUpdateRequest;
import com.hardwareshop.dto.response.ProductResponse;
import com.hardwareshop.entity.Product;
import com.hardwareshop.exception.InvalidOperationException;
import com.hardwareshop.exception.ResourceNotFoundException;
import com.hardwareshop.notification.NotificationService;
import com.hardwareshop.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final NotificationService notificationService;

    public ProductService(ProductRepository productRepository, NotificationService notificationService) {
        this.productRepository = productRepository;
        this.notificationService = notificationService;
    }

    public Page<ProductResponse> getAllProducts(String query, String category, Pageable pageable) {
        return productRepository.searchProducts(query, category, pageable)
                .map(this::mapToResponse);
    }

    public ProductResponse getProductById(Long id) {
        Product product = getProductEntity(id);
        return mapToResponse(product);
    }

    public Product getProductEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        Product product = new Product(
                request.getName(),
                request.getDescription(),
                request.getCategory(),
                request.getPrice(),
                request.getAvailableQuantity(),
                request.getImageUrl(),
                request.getLowStockLimit(),
                request.getLowStockNotificationEnabled()
        );
        product.setExpectedRestockDate(request.getExpectedRestockDate());
        product = productRepository.save(product);

        log.info("Created product '{}' with stock {}", product.getName(), product.getAvailableQuantity());
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = getProductEntity(id);
        int oldStock = product.getAvailableQuantity();

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());
        product.setAvailableQuantity(request.getAvailableQuantity());
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }
        if (request.getLowStockLimit() != null) {
            product.setLowStockLimit(request.getLowStockLimit());
        }
        if (request.getLowStockNotificationEnabled() != null) {
            product.setLowStockNotificationEnabled(request.getLowStockNotificationEnabled());
        }
        product.setExpectedRestockDate(request.getExpectedRestockDate());

        // Re-arm low stock alert if stock is now above threshold
        if (product.getAvailableQuantity() > product.getLowStockLimit()) {
            product.setLowStockAlertSent(false);
        }

        product = productRepository.save(product);
        log.info("Updated product id: {} (stock: {} -> {})", id, oldStock, product.getAvailableQuantity());
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse updateStock(Long id, StockUpdateRequest request) {
        Product product = getProductEntity(id);
        int currentStock = product.getAvailableQuantity();
        int newStock = currentStock + request.getQuantityChange();

        if (newStock < 0) {
            throw new InvalidOperationException("Stock cannot be negative. Current stock is " + currentStock +
                    ", requested change is " + request.getQuantityChange());
        }

        product.setAvailableQuantity(newStock);

        // Duplicate-alert protection logic:
        // If stock is replenished above threshold, re-arm for future alert
        if (newStock > product.getLowStockLimit()) {
            if (Boolean.TRUE.equals(product.getLowStockAlertSent())) {
                log.info("Product '{}' stock ({}) replenished above limit ({}). Re-arming low-stock alert.",
                        product.getName(), newStock, product.getLowStockLimit());
            }
            product.setLowStockAlertSent(false);
        } else if (newStock <= product.getLowStockLimit() &&
                Boolean.TRUE.equals(product.getLowStockNotificationEnabled()) &&
                !Boolean.TRUE.equals(product.getLowStockAlertSent())) {
            // Trigger alert on manual stock decrease below limit
            notificationService.sendLowStockNotification(product);
            product.setLowStockAlertSent(true);
        }

        product = productRepository.save(product);
        log.info("Stock updated for product '{}' (id: {}): {} -> {} (Reason: {})",
                product.getName(), id, currentStock, newStock, request.getReason());

        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse updateLowStockSettings(Long id, LowStockSettingsRequest request) {
        Product product = getProductEntity(id);
        product.setLowStockLimit(request.getLowStockLimit());
        product.setLowStockNotificationEnabled(request.getLowStockNotificationEnabled());

        // If threshold raised above current stock and not alerted yet, alert if enabled
        if (product.getAvailableQuantity() <= product.getLowStockLimit() &&
                Boolean.TRUE.equals(product.getLowStockNotificationEnabled()) &&
                !Boolean.TRUE.equals(product.getLowStockAlertSent())) {
            notificationService.sendLowStockNotification(product);
            product.setLowStockAlertSent(true);
        } else if (product.getAvailableQuantity() > product.getLowStockLimit()) {
            product.setLowStockAlertSent(false);
        }

        product = productRepository.save(product);
        log.info("Updated low-stock settings for product '{}': limit={}, enabled={}",
                product.getName(), product.getLowStockLimit(), product.getLowStockNotificationEnabled());

        return mapToResponse(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductEntity(id);
        productRepository.delete(product);
        log.info("Deleted product id: {}", id);
    }

    public List<String> getCategories() {
        return productRepository.findDistinctCategories();
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ProductResponse mapToResponse(Product product) {
        ProductResponse res = new ProductResponse();
        res.setId(product.getId());
        res.setName(product.getName());
        res.setDescription(product.getDescription());
        res.setCategory(product.getCategory());
        res.setPrice(product.getPrice());
        res.setAvailableQuantity(product.getAvailableQuantity());
        res.setImageUrl(product.getImageUrl());
        res.setOutOfStock(product.getOutOfStock());
        res.setExpectedRestockDate(product.getExpectedRestockDate());
        res.setLowStockLimit(product.getLowStockLimit());
        res.setLowStockNotificationEnabled(product.getLowStockNotificationEnabled());
        res.setLowStockAlertSent(product.getLowStockAlertSent());
        res.setCreatedAt(product.getCreatedAt());
        res.setUpdatedAt(product.getUpdatedAt());

        // Determine stock badge status
        if (product.getAvailableQuantity() <= 0) {
            res.setStockStatus("OUT_OF_STOCK");
        } else if (product.getAvailableQuantity() <= product.getLowStockLimit()) {
            res.setStockStatus("LOW_STOCK");
        } else {
            res.setStockStatus("AVAILABLE");
        }

        return res;
    }
}
