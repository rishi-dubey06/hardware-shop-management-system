package com.hardwareshop.repository;

import com.hardwareshop.entity.PaymentStatus;
import com.hardwareshop.entity.Sale;
import com.hardwareshop.entity.SaleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByBillNumber(String billNumber);

    Page<Sale> findBySaleStatus(SaleStatus status, Pageable pageable);

    Page<Sale> findByPaymentStatus(PaymentStatus status, Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE " +
           "(:saleStatus IS NULL OR s.saleStatus = :saleStatus) AND " +
           "(:paymentStatus IS NULL OR s.paymentStatus = :paymentStatus) " +
           "ORDER BY s.createdAt DESC")
    Page<Sale> findSalesFiltered(@Param("saleStatus") SaleStatus saleStatus,
                                 @Param("paymentStatus") PaymentStatus paymentStatus,
                                 Pageable pageable);

    List<Sale> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    long countBySaleStatus(SaleStatus status);

    long countByPaymentStatus(PaymentStatus status);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate = :date")
    long countTodaySales(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.saleDate = :date AND s.saleStatus = 'CONFIRMED'")
    BigDecimal sumTodayConfirmedSalesAmount(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.saleStatus = 'CONFIRMED'")
    BigDecimal sumTotalSalesAmount();

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.paymentStatus = 'SUCCESS'")
    BigDecimal sumTotalPaidAmount();

    List<Sale> findTop10ByOrderByCreatedAtDesc();
}
