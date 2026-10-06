package com.hardwareshop.repository;

import com.hardwareshop.entity.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Test
    @DisplayName("Should query low stock products and sum stock correctly")
    void testLowStockAndSumStockQueries() {
        Product p1 = new Product("PVC Pipe", "Pipe", "Plumbing", new BigDecimal("150.00"), 50, null, 10, true);
        Product p2 = new Product("Brass Valve", "Valve", "Plumbing", new BigDecimal("280.00"), 8, null, 10, true);
        Product p3 = new Product("Light", "LED", "Electrical", new BigDecimal("500.00"), 0, null, 5, true);

        productRepository.saveAll(List.of(p1, p2, p3));

        long totalStock = productRepository.sumTotalStock();
        assertThat(totalStock).isEqualTo(58); // 50 + 8 + 0 = 58

        long lowStockCount = productRepository.countLowStockProducts();
        assertThat(lowStockCount).isEqualTo(2); // p2 (8 <= 10) and p3 (0 <= 5)

        long outOfStockCount = productRepository.countByOutOfStockTrue();
        assertThat(outOfStockCount).isEqualTo(1); // p3 (0 stock)

        Page<Product> searchResult = productRepository.searchProducts("PVC", "Plumbing", PageRequest.of(0, 10));
        assertThat(searchResult.getContent()).hasSize(1);
        assertThat(searchResult.getContent().get(0).getName()).isEqualTo("PVC Pipe");
    }
}
