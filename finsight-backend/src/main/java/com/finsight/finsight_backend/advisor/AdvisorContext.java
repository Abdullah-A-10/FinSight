package com.finsight.finsight_backend.advisor;

import java.math.BigDecimal;
import java.util.Map;

import com.finsight.finsight_backend.model.DTO.SimulationResult;
import com.finsight.finsight_backend.model.entity.Transaction.Category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorContext {

    // user identity
    private Long  userId;

    // financial summary
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpenses;
    private BigDecimal monthlySurplus;
    private BigDecimal theoreticalSavingsRate;
    private BigDecimal actualSavingsRate;
    private BigDecimal savingsGap;
    private BigDecimal actuallySavedAmount;
    private BigDecimal emergencyRunway;
    private BigDecimal netWorth;

    // category breakdown
    private Map<Category, BigDecimal> categoryBreakdown;
    private Category topSpendingCategory;

    // simulation results
    private SimulationResult simulation;

    // account count
    private int accountCount;
}