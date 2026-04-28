package com.finsight.finsight_backend.controller;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finsight.finsight_backend.model.DTO.DashboardSummary;
import com.finsight.finsight_backend.model.entity.Transaction.Category;
import com.finsight.finsight_backend.service.FinancialSummaryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final FinancialSummaryService summaryService;

    // ─────────────────────────────────────────
    // FULL DASHBOARD (MAIN API)
    // ─────────────────────────────────────────

    // GET /api/summary/{userId}
    @GetMapping("/{userId}")
    public ResponseEntity<DashboardSummary> getSummary(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getDashboardSummary(userId)
        );
    }

    // ─────────────────────────────────────────
    // CORE METRICS
    // ─────────────────────────────────────────

    @GetMapping("/{userId}/income")
    public ResponseEntity<BigDecimal> getIncome(@PathVariable Long userId) {
        return ResponseEntity.ok(
                summaryService.getRealMonthlyIncome(userId)
        );
    }

    @GetMapping("/{userId}/expenses")
    public ResponseEntity<BigDecimal> getExpenses(@PathVariable Long userId) {
        return ResponseEntity.ok(
                summaryService.getRealMonthlyExpenses(userId)
        );
    }

    @GetMapping("/{userId}/surplus")
    public ResponseEntity<BigDecimal> getSurplus(@PathVariable Long userId) {
        return ResponseEntity.ok(
                summaryService.getRealMonthlySurplus(userId)
        );
    }

    // ─────────────────────────────────────────
    // SAVINGS INSIGHTS
    // ─────────────────────────────────────────

    @GetMapping("/{userId}/savings/theoretical")
    public ResponseEntity<BigDecimal> getTheoreticalSavingsRate(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getTheoreticalSavingsRate(userId)
        );
    }

    @GetMapping("/{userId}/savings/actual")
    public ResponseEntity<BigDecimal> getActualSavingsRate(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getActualSavingsRate(userId)
        );
    }

    @GetMapping("/{userId}/savings/gap")
    public ResponseEntity<BigDecimal> getSavingsGap(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getSavingsGap(userId)
        );
    }

    @GetMapping("/{userId}/savings/amount")
    public ResponseEntity<BigDecimal> getSavedAmount(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getActuallySavedAmount(userId)
        );
    }

    // ─────────────────────────────────────────
    // FINANCIAL HEALTH
    // ─────────────────────────────────────────

    @GetMapping("/{userId}/runway")
    public ResponseEntity<BigDecimal> getRunway(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getEmergencyRunway(userId)
        );
    }

    @GetMapping("/{userId}/smoothed-surplus")
    public ResponseEntity<BigDecimal> getSmoothedSurplus(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getSmoothedMonthlySurplus(userId)
        );
    }

    // ─────────────────────────────────────────
    // CATEGORY ANALYSIS (FOR CHARTS + AI)
    // ─────────────────────────────────────────

    @GetMapping("/{userId}/categories")
    public ResponseEntity<Map<Category, BigDecimal>> getCategoryBreakdown(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getCategoryBreakdown(userId)
        );
    }

    @GetMapping("/{userId}/categories/top")
    public ResponseEntity<Category> getTopCategory(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                summaryService.getTopSpendingCategory(userId)
        );
    }
}