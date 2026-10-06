package com.hardwareshop.util;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class BillNumberGenerator {

    private final AtomicInteger counter = new AtomicInteger(1000);

    public String generateBillNumber() {
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy"));
        int seq = counter.incrementAndGet() % 10000;
        return String.format("INV-%s-%04d", year, seq);
    }
}
