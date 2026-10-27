package com.hardwareshop.util;

import java.math.BigDecimal;

public final class IndianCurrencyWords {

    private static final String[] UNITS = {
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"
    };

    private static final String[] TENS = {
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    private IndianCurrencyWords() {
    }

    public static String convertToIndianCurrency(BigDecimal amount) {
        if (amount == null) {
            return "Zero Rupees Only";
        }

        long rupees = amount.longValue();
        int paise = Math.abs(amount.remainder(BigDecimal.ONE).multiply(BigDecimal.valueOf(100)).intValue());

        if (rupees == 0 && paise == 0) {
            return "Zero Rupees Only";
        }

        StringBuilder words = new StringBuilder();
        if (rupees > 0) {
            words.append(convertNumberToWords(rupees)).append(" Rupees");
        }

        if (paise > 0) {
            if (rupees > 0) {
                words.append(" and ");
            }
            words.append(convertNumberToWords(paise)).append(" Paise");
        }

        words.append(" Only");
        return words.toString().replaceAll("\\s+", " ").trim();
    }

    private static String convertNumberToWords(long n) {
        if (n == 0) {
            return "Zero";
        }

        StringBuilder sb = new StringBuilder();

        // Crores (1,00,00,000)
        long crore = n / 10000000;
        n %= 10000000;
        if (crore > 0) {
            sb.append(convertNumberToWords(crore)).append(" Crore ");
        }

        // Lakhs (1,00,000)
        long lakh = n / 100000;
        n %= 100000;
        if (lakh > 0) {
            sb.append(convertTwoDigit((int) lakh)).append(" Lakh ");
        }

        // Thousands (1,000)
        long thousand = n / 1000;
        n %= 1000;
        if (thousand > 0) {
            sb.append(convertTwoDigit((int) thousand)).append(" Thousand ");
        }

        // Hundreds (100)
        long hundred = n / 100;
        n %= 100;
        if (hundred > 0) {
            sb.append(UNITS[(int) hundred]).append(" Hundred ");
        }

        // Remaining 2 digits (< 100)
        if (n > 0) {
            sb.append(convertTwoDigit((int) n)).append(" ");
        }

        return sb.toString().trim();
    }

    private static String convertTwoDigit(int n) {
        if (n < 20) {
            return UNITS[n];
        }
        return TENS[n / 10] + (n % 10 != 0 ? " " + UNITS[n % 10] : "");
    }
}
