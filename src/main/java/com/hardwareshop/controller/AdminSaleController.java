package com.hardwareshop.controller;

import com.hardwareshop.dto.request.PaymentConfirmationRequest;
import com.hardwareshop.dto.request.SaleCreateRequest;
import com.hardwareshop.dto.response.ApiResponse;
import com.hardwareshop.dto.response.BillResponse;
import com.hardwareshop.dto.response.SaleResponse;
import com.hardwareshop.entity.PaymentStatus;
import com.hardwareshop.entity.SaleStatus;
import com.hardwareshop.service.BillService;
import com.hardwareshop.service.PaymentService;
import com.hardwareshop.service.SaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/sales")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Sales & Billing", description = "Pending sales creation, SELL confirmation, payment confirmations, and bill receipts")
public class AdminSaleController {

    private final SaleService saleService;
    private final PaymentService paymentService;
    private final BillService billService;

    public AdminSaleController(SaleService saleService,
                               PaymentService paymentService,
                               BillService billService) {
        this.saleService = saleService;
        this.paymentService = paymentService;
        this.billService = billService;
    }

    @PostMapping
    @Operation(summary = "Create a PENDING sale (Stock is NOT reduced at this step)")
    public ResponseEntity<ApiResponse<SaleResponse>> createPendingSale(@Valid @RequestBody SaleCreateRequest request) {
        SaleResponse response = saleService.createPendingSale(request);
        return new ResponseEntity<>(
                ApiResponse.success("Pending sale created successfully. Stock is unchanged.", response),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    @Operation(summary = "List all sales with optional status filters and pagination")
    public ResponseEntity<ApiResponse<Page<SaleResponse>>> getAllSales(
            @RequestParam(required = false) SaleStatus saleStatus,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {

        Sort sorting = Sort.by(Sort.Direction.fromString(sort.length > 1 ? sort[1] : "desc"), sort[0]);
        Pageable pageable = PageRequest.of(page, size, sorting);
        Page<SaleResponse> sales = saleService.getAllSales(saleStatus, paymentStatus, pageable);

        return ResponseEntity.ok(ApiResponse.success("Sales retrieved", sales));
    }

    @GetMapping("/pending")
    @Operation(summary = "List only pending sales awaiting SELL confirmation")
    public ResponseEntity<ApiResponse<Page<SaleResponse>>> getPendingSales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SaleResponse> pendingSales = saleService.getPendingSales(pageable);
        return ResponseEntity.ok(ApiResponse.success("Pending sales retrieved", pendingSales));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sale details by ID")
    public ResponseEntity<ApiResponse<SaleResponse>> getSaleById(@PathVariable Long id) {
        SaleResponse sale = saleService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.success("Sale details", sale));
    }

    @PostMapping("/{id}/sell")
    @Operation(summary = "SELL BUTTON: Finalize sale, deduct stock, trigger purchase notification")
    public ResponseEntity<ApiResponse<SaleResponse>> confirmSale(@PathVariable Long id) {
        SaleResponse response = saleService.confirmSale(id);
        return ResponseEntity.ok(
                ApiResponse.success("Sale confirmed successfully! Inventory deducted and customer notification sent.", response)
        );
    }

    @PostMapping("/{id}/confirm-payment")
    @Operation(summary = "CONFIRM PAYMENT BUTTON: Mark payment SUCCESS and trigger payment success notification")
    public ResponseEntity<ApiResponse<SaleResponse>> confirmPayment(
            @PathVariable Long id,
            @RequestBody(required = false) PaymentConfirmationRequest request) {

        SaleResponse response = paymentService.confirmPayment(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Payment confirmed SUCCESS! Customer payment notification sent.", response)
        );
    }

    @GetMapping("/{id}/bill")
    @Operation(summary = "Generate formatted bill and receipt text for a sale")
    public ResponseEntity<ApiResponse<BillResponse>> getBill(@PathVariable Long id) {
        BillResponse bill = billService.getBill(id);
        return ResponseEntity.ok(ApiResponse.success("Bill generated", bill));
    }

    @GetMapping(value = "/{id}/bill/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download printable PDF bill for a sale")
    public ResponseEntity<byte[]> getPdfBill(@PathVariable Long id) {
        byte[] pdfBytes = billService.generatePdfBill(id);
        SaleResponse sale = saleService.getSaleById(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Invoice-" + sale.getBillNumber() + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
