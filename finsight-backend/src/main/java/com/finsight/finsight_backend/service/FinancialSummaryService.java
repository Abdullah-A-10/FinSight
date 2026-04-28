package com.finsight.finsight_backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.finsight.finsight_backend.model.DTO.DashboardSummary;
import com.finsight.finsight_backend.model.entity.Transaction.Category;
import com.finsight.finsight_backend.model.entity.Transaction.TransactionType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FinancialSummaryService {

    private final TransactionService transactionService;
    private final AccountService accountService;

    // ─────────────────────────────────────────
    // CORE INCOME & EXPENSE
    // ─────────────────────────────────────────
    public BigDecimal getRealMonthlyIncome(Long userId) {
        LocalDate now = LocalDate.now();
        return safe(transactionService.getMonthlyTotal(
                userId,
                TransactionType.INCOME,
                now.getMonthValue(),
                now.getYear()
        ));
    }

    public BigDecimal getRealLastMonthlyIncome(Long userId) {
        LocalDate now = LocalDate.now();
        return safe(transactionService.getMonthlyTotal(
                userId,
                TransactionType.INCOME,
                now.getMonthValue()-1,
                now.getYear()
        ));
    }

    public BigDecimal getRealMonthlyExpenses(Long userId) {
        LocalDate now = LocalDate.now();
        return safe(transactionService.getMonthlyTotal(
                userId,
                TransactionType.EXPENSE,
                now.getMonthValue(),
                now.getYear()
        ));
    }

    public BigDecimal getRealLastMonthlyExpenses(Long userId) {
        LocalDate now = LocalDate.now();
        return safe(transactionService.getMonthlyTotal(
                userId,
                TransactionType.EXPENSE,
                now.getMonthValue() - 1,
                now.getYear()
        ));
    }

    public BigDecimal getRealMonthlySurplus(Long userId) {
        return getRealMonthlyIncome(userId)
                .subtract(getRealMonthlyExpenses(userId));
    }

    public BigDecimal getRealLastMonthlySurplus(Long userId) {
        return getRealLastMonthlyIncome(userId)
                .subtract(getRealLastMonthlyExpenses(userId));
    }


    // ─────────────────────────────────────────
    // SAVINGS RATES
    // ─────────────────────────────────────────
    // Theoretical: (Surplus / Income)
    public BigDecimal getTheoreticalSavingsRate(Long userId) {
        BigDecimal income = getRealMonthlyIncome(userId);
        if (isZero(income)) {
            return BigDecimal.ZERO;
        }

        return getRealMonthlySurplus(userId)
                .divide(income, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP);
    }

    // Actual: (Savings + Investment) / Income
    public BigDecimal getActualSavingsRate(Long userId) {
        LocalDate now = LocalDate.now();

        BigDecimal savings = safe(transactionService.getMonthlyTotal(
                userId,
                TransactionType.SAVINGS,
                now.getMonthValue(),
                now.getYear()
        ));

        BigDecimal income = getRealMonthlyIncome(userId);

        if (isZero(income)) {
            return BigDecimal.ZERO;
        }

        return savings
                .divide(income, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP);
    }

    public BigDecimal getSavingsGap(Long userId) {
        return getTheoreticalSavingsRate(userId)
                .subtract(getActualSavingsRate(userId))
                .max(BigDecimal.ZERO);
    }

    public BigDecimal getActuallySavedAmount(Long userId) {
        LocalDate now = LocalDate.now();

        return safe(transactionService.getMonthlyTotal(
                userId,
                TransactionType.SAVINGS,
                now.getMonthValue(),
                now.getYear()
        ));
    }

    public BigDecimal getAllSavings(Long userId) {

        return safe(transactionService.getAllSavings(userId));
    }

    // ─────────────────────────────────────────
    // SMOOTHED SURPLUS (3-MONTH AVG)
    // ─────────────────────────────────────────
    public BigDecimal getSmoothedMonthlySurplus(Long userId) {
        LocalDate now = LocalDate.now();
        BigDecimal total = BigDecimal.ZERO;

        for (int i = 0; i < 3; i++) {
            LocalDate month = now.minusMonths(i);

            BigDecimal income = safe(transactionService.getMonthlyTotal(
                    userId, TransactionType.INCOME,
                    month.getMonthValue(), month.getYear()
            ));

            BigDecimal expenses = safe(transactionService.getMonthlyTotal(
                    userId, TransactionType.EXPENSE,
                    month.getMonthValue(), month.getYear()
            ));

            total = total.add(income.subtract(expenses));
        }

        return total.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
    }

    // ─────────────────────────────────────────
    // EMERGENCY RUNWAY
    // ─────────────────────────────────────────
    public BigDecimal getEmergencyRunway(Long userId) {
        BigDecimal netWorth = safe(accountService.getNetWorth(userId));
        BigDecimal expenses = getRealMonthlyExpenses(userId);
        BigDecimal previousExpenses = getRealLastMonthlyExpenses(userId);

        if (isZero(expenses)) {

            return netWorth.divide(previousExpenses, 1, RoundingMode.HALF_UP)
                    .max(BigDecimal.ZERO);
        }

        if (isZero(previousExpenses)) {
            return BigDecimal.valueOf(0);
        }

        return netWorth.divide(expenses, 1, RoundingMode.HALF_UP)
                .max(BigDecimal.ZERO);

    }

    // ─────────────────────────────────────────
    // CATEGORY ANALYSIS
    // ─────────────────────────────────────────
    public Map<Category, BigDecimal> getCategoryBreakdown(Long userId) {
        LocalDate now = LocalDate.now();

        Category[] categories = {
            Category.FOOD, Category.TRANSPORT, Category.HOUSING,
            Category.HEALTH, Category.EDUCATION,
            Category.ENTERTAINMENT, Category.SHOPPING,
            Category.UTILITIES, Category.OTHER
        };

        Map<Category, BigDecimal> breakdown = new LinkedHashMap<>();

        for (Category cat : categories) {
            BigDecimal amount = safe(transactionService.getCategoryTotal(
                    userId, cat,
                    now.getMonthValue(), now.getYear()
            ));

            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                breakdown.put(cat, amount);
            }
        }

        return breakdown;
    }

    public BigDecimal getCategorySpend(
            Long userId, Category category,
            int month, int year) {
        return safe(transactionService
                .getCategoryTotal(userId, category, month, year));
    }

    public Category getTopSpendingCategory(Long userId) {
        return getCategoryBreakdown(userId)
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(Category.OTHER);
    }

    // ─────────────────────────────────────────
    // DASHBOARD SUMMARY
    // ─────────────────────────────────────────
    public DashboardSummary getDashboardSummary(Long userId) {
        return new DashboardSummary(
                getRealMonthlyIncome(userId),
                getRealLastMonthlyIncome(userId),
                getRealMonthlyExpenses(userId),
                getRealLastMonthlyExpenses(userId),
                getRealMonthlySurplus(userId),
                getRealLastMonthlySurplus(userId),
                getTheoreticalSavingsRate(userId),
                getActualSavingsRate(userId),
                getSavingsGap(userId),
                getActuallySavedAmount(userId),
                getAllSavings(userId),
                getEmergencyRunway(userId),
                accountService.getNetWorth(userId),
                accountService.getNetSavings(userId),
                getSmoothedMonthlySurplus(userId),
                getTopSpendingCategory(userId),
                getCategoryBreakdown(userId)
        );
    }

    // ─────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────
    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private boolean isZero(BigDecimal val) {
        return val.compareTo(BigDecimal.ZERO) == 0;
    }
}
