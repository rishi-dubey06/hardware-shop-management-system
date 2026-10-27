package com.hardwareshop.service;

import com.hardwareshop.dto.response.BillResponse;
import com.hardwareshop.entity.*;
import com.hardwareshop.util.IndianCurrencyWords;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillServiceTest {

    @Mock
    private SaleService saleService;

    @InjectMocks
    private BillService billService;

    private Sale sampleSale;
    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(billService, "shopName", "XYZ HARDWARE SHOP");
        ReflectionTestUtils.setField(billService, "shopContact", "+91 98765 43210");
        ReflectionTestUtils.setField(billService, "shopAddress", "Shop #12, Market, UP");
        ReflectionTestUtils.setField(billService, "shopGstin", "09AABCU9603R1ZM");
        ReflectionTestUtils.setField(billService, "shopState", "09 - Uttar Pradesh");

        sampleCustomer = new Customer();
        sampleCustomer.setId(1L);
        sampleCustomer.setName("Rahul Sharma");
        sampleCustomer.setPhoneNumber("+919876543210");
        sampleCustomer.setAddress("Sector 62, Noida");

        sampleSale = new Sale();
        sampleSale.setId(101L);
        sampleSale.setBillNumber("INV-2026-0001");
        sampleSale.setCustomer(sampleCustomer);
        sampleSale.setSaleDate(LocalDate.of(2026, 10, 27));
        sampleSale.setSaleTime(LocalTime.of(14, 30));
        sampleSale.setPaymentMethod(PaymentMethod.CASH);
        sampleSale.setPaymentStatus(PaymentStatus.SUCCESS);
        sampleSale.setSaleStatus(SaleStatus.CONFIRMED);
        sampleSale.setTotalAmount(new BigDecimal("1550.00"));

        Product product = new Product();
        product.setId(10L);
        product.setName("PVC Pipe 1 inch");
        product.setCategory("Plumbing");
        product.setPrice(new BigDecimal("775.00"));

        SaleItem item = new SaleItem(product, 2, new BigDecimal("775.00"));
        sampleSale.addItem(item);
    }

    @Test
    void shouldReturnBillResponseWithAllGstAndNotificationFields() {
        when(saleService.getSaleEntity(101L)).thenReturn(sampleSale);

        BillResponse bill = billService.getBill(101L);

        assertThat(bill).isNotNull();
        assertThat(bill.getSaleId()).isEqualTo(101L);
        assertThat(bill.getBillNumber()).isEqualTo("INV-2026-0001");
        assertThat(bill.getCustomerName()).isEqualTo("Rahul Sharma");
        assertThat(bill.getShopGstin()).isEqualTo("09AABCU9603R1ZM");
        assertThat(bill.getTotalInWords()).isEqualTo("One Thousand Five Hundred Fifty Rupees Only");
        assertThat(bill.getWhatsappShareUrl()).contains("api.whatsapp.com/send?phone=919876543210");
        assertThat(bill.getWhatsappShareUrl()).contains("INV-2026-0001");
        assertThat(bill.getSmsShareUrl()).contains("sms:+919876543210");
        assertThat(bill.getItems()).hasSize(1);
        assertThat(bill.getItems().get(0).getHsnCode()).isEqualTo("3917");
        assertThat(bill.getSubtotalAmount()).isNotNull();
        assertThat(bill.getCgstAmount()).isNotNull();
        assertThat(bill.getSgstAmount()).isNotNull();
    }

    @Test
    void shouldGenerateValidPdfDocument() {
        when(saleService.getSaleEntity(101L)).thenReturn(sampleSale);

        byte[] pdfBytes = billService.generatePdfBill(101L);

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1000);
        // Standard PDF magic header: %PDF
        String header = new String(pdfBytes, 0, 4);
        assertThat(header).isEqualTo("%PDF");
    }

    @Test
    void shouldConvertIndianCurrencyToWordsAccurately() {
        assertThat(IndianCurrencyWords.convertToIndianCurrency(new BigDecimal("1550.00")))
                .isEqualTo("One Thousand Five Hundred Fifty Rupees Only");

        assertThat(IndianCurrencyWords.convertToIndianCurrency(new BigDecimal("100000.00")))
                .isEqualTo("One Lakh Rupees Only");

        assertThat(IndianCurrencyWords.convertToIndianCurrency(new BigDecimal("2500000.00")))
                .isEqualTo("Twenty Five Lakh Rupees Only");

        assertThat(IndianCurrencyWords.convertToIndianCurrency(new BigDecimal("50.50")))
                .isEqualTo("Fifty Rupees and Fifty Paise Only");
    }
}
