package com.hardwareshop.service;

import com.hardwareshop.dto.response.DashboardResponse;
import com.hardwareshop.entity.PaymentStatus;
import com.hardwareshop.entity.SaleStatus;
import com.hardwareshop.repository.CustomerRepository;
import com.hardwareshop.repository.PaymentRepository;
import com.hardwareshop.repository.ProductRepository;
import com.hardwareshop.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final CustomerRepository customerRepository;
    private final PaymentRepository paymentRepository;
    private final ProductService productService;
    private final SaleService saleService;
    private final CustomerService customerService;

    public DashboardService(ProductRepository productRepository,
                            SaleRepository saleRepository,
                            CustomerRepository customerRepository,
                            PaymentRepository paymentRepository,
                            ProductService productService,
                            SaleService saleService,
                            CustomerService customerService) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.customerRepository = customerRepository;
        this.paymentRepository = paymentRepository;
        this.productService = productService;
        this.saleService = saleService;
        this.customerService = customerService;
    }

    public DashboardResponse getDashboardMetrics() {
        DashboardResponse res = new DashboardResponse();

        // Inventory metrics
        res.setTotalProducts(productRepository.count());
        res.setTotalStock(productRepository.sumTotalStock());
        res.setLowStockCount(productRepository.countLowStockProducts());
        res.setOutOfStockCount(productRepository.countByOutOfStockTrue());

        // Sales metrics
        LocalDate today = LocalDate.now();
        res.setTodaySalesCount(saleRepository.countTodaySales(today));
        res.setTodaySalesAmount(saleRepository.sumTodayConfirmedSalesAmount(today));
        res.setTotalSalesCount(saleRepository.countBySaleStatus(SaleStatus.CONFIRMED));
        res.setTotalSalesAmount(saleRepository.sumTotalSalesAmount());
        res.setPendingSalesCount(saleRepository.countBySaleStatus(SaleStatus.PENDING));
        res.setConfirmedSalesCount(saleRepository.countBySaleStatus(SaleStatus.CONFIRMED));

        // Payment metrics
        res.setPendingPaymentsCount(saleRepository.countByPaymentStatus(PaymentStatus.PENDING));
        res.setSuccessfulPaymentsCount(saleRepository.countByPaymentStatus(PaymentStatus.SUCCESS));
        BigDecimal paidAmount = saleRepository.sumTotalPaidAmount();
        res.setTotalPaidAmount(paidAmount != null ? paidAmount : BigDecimal.ZERO);

        // Customer metrics
        res.setTotalCustomersCount(customerRepository.count());

        // Lists for UI widgets
        res.setLowStockProducts(productService.getLowStockProducts());
        res.setOutOfStockProducts(productRepository.findByOutOfStockTrue().stream()
                .map(productService::mapToResponse)
                .toList());
        res.setRecentSales(saleRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(saleService::mapToResponse)
                .toList());
        res.setRecentCustomers(customerService.getRecentCustomers());

        return res;
    }
}
