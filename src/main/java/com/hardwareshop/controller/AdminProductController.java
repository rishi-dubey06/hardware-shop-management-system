package com.hardwareshop.controller;

import com.hardwareshop.dto.request.LowStockSettingsRequest;
import com.hardwareshop.dto.request.ProductCreateRequest;
import com.hardwareshop.dto.request.ProductUpdateRequest;
import com.hardwareshop.dto.request.StockUpdateRequest;
import com.hardwareshop.dto.response.ApiResponse;
import com.hardwareshop.dto.response.ProductResponse;
import com.hardwareshop.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Product Management", description = "Admin CRUD, inventory adjustments, and low-stock configurations")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "List all products for admin with pagination and filters")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        Sort sorting = Sort.by(Sort.Direction.fromString(sort.length > 1 ? sort[1] : "desc"), sort[0]);
        Pageable pageable = PageRequest.of(page, size, sorting);
        Page<ProductResponse> products = productService.getAllProducts(query, category, pageable);

        return ResponseEntity.ok(ApiResponse.success("Products retrieved", products));
    }

    @PostMapping
    @Operation(summary = "Create a new product")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.createProduct(request);
        return new ResponseEntity<>(ApiResponse.success("Product created successfully", response), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product details")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id, @Valid @RequestBody ProductUpdateRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully"));
    }

    @PostMapping("/{id}/stock")
    @Operation(summary = "Update product stock quantity (+/-)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateStock(
            @PathVariable Long id, @Valid @RequestBody StockUpdateRequest request) {
        ProductResponse response = productService.updateStock(id, request);
        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", response));
    }

    @PutMapping("/{id}/low-stock-settings")
    @Operation(summary = "Configure low-stock alert threshold and notification enabled toggle")
    public ResponseEntity<ApiResponse<ProductResponse>> updateLowStockSettings(
            @PathVariable Long id, @Valid @RequestBody LowStockSettingsRequest request) {
        ProductResponse response = productService.updateLowStockSettings(id, request);
        return ResponseEntity.ok(ApiResponse.success("Low-stock settings updated", response));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "List all products currently below low-stock limit")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts() {
        List<ProductResponse> lowStock = productService.getLowStockProducts();
        return ResponseEntity.ok(ApiResponse.success("Low stock products", lowStock));
    }
}
