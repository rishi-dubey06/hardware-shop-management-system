package com.hardwareshop.repository;

import com.hardwareshop.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "(:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR LOWER(p.category) = LOWER(:category))")
    Page<Product> searchProducts(@Param("query") String query, @Param("category") String category, Pageable pageable);

    long countByOutOfStockTrue();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.availableQuantity <= p.lowStockLimit")
    long countLowStockProducts();

    @Query("SELECT COALESCE(SUM(p.availableQuantity), 0) FROM Product p")
    long sumTotalStock();

    @Query("SELECT p FROM Product p WHERE p.availableQuantity <= p.lowStockLimit")
    List<Product> findLowStockProducts();

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL AND p.category <> ''")
    List<String> findDistinctCategories();

    List<Product> findByOutOfStockTrue();
}
