package com.hardwareshop.controller;

import com.hardwareshop.dto.request.CustomerRequest;
import com.hardwareshop.dto.response.ApiResponse;
import com.hardwareshop.dto.response.CustomerResponse;
import com.hardwareshop.dto.response.SaleResponse;
import com.hardwareshop.service.CustomerService;
import com.hardwareshop.service.SaleService;
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
@RequestMapping("/api/admin/customers")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Customer Management", description = "Customer records and purchase history")
public class AdminCustomerController {

    private final CustomerService customerService;
    private final SaleService saleService;

    public AdminCustomerController(CustomerService customerService, SaleService saleService) {
        this.customerService = customerService;
        this.saleService = saleService;
    }

    @GetMapping
    @Operation(summary = "Search and list customers with pagination")
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> getAllCustomers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        Sort sorting = Sort.by(Sort.Direction.fromString(sort.length > 1 ? sort[1] : "desc"), sort[0]);
        Pageable pageable = PageRequest.of(page, size, sorting);
        Page<CustomerResponse> customers = customerService.getAllCustomers(query, pageable);

        return ResponseEntity.ok(ApiResponse.success("Customers retrieved", customers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer details by ID")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long id) {
        CustomerResponse customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success("Customer found", customer));
    }

    @PostMapping
    @Operation(summary = "Create customer record")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return new ResponseEntity<>(ApiResponse.success("Customer created", response), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer record")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success("Customer updated", response));
    }

    @GetMapping("/{id}/sales")
    @Operation(summary = "View customer purchase history")
    public ResponseEntity<ApiResponse<List<SaleResponse>>> getCustomerPurchaseHistory(@PathVariable Long id) {
        List<SaleResponse> sales = saleService.getCustomerSales(id);
        return ResponseEntity.ok(ApiResponse.success("Customer purchase history", sales));
    }
}
