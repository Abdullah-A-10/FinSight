package com.finsight.finsight_backend.model.DTO;

import java.math.BigDecimal;
import java.util.Map;

import com.finsight.finsight_backend.model.entity.Transaction.Category;

public record DashboardSummary(

        BigDecimal monthlyIncome,
        BigDecimal lastMonthlyIncome,
        BigDecimal monthlyExpenses,
        BigDecimal lastMonthlyExpenses,
        BigDecimal monthlySurplus,
        BigDecimal lastMonthlySurplus,

        BigDecimal theoreticalSavingsRate,
        BigDecimal actualSavingsRate,
        BigDecimal savingsGap,
        BigDecimal actuallySavedAmount,
        BigDecimal AllSavings,

        BigDecimal emergencyRunway,
        BigDecimal netWorth,
        BigDecimal netSavings,

        BigDecimal smoothedMonthlySurplus,

        Category topSpendingCategory,
        Map<Category, BigDecimal> categoryBreakdown

) {}