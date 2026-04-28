package com.finsight.finsight_backend.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;
import com.finsight.finsight_backend.model.DTO.SimulationRequest;
import com.finsight.finsight_backend.model.DTO.SimulationResult;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RuleEngineService {

    // Spring auto-injects ALL Rule implementations
    private final UserService userService;
    private final List<Rule>              rules;
    private final FinancialSummaryService  summaryService;
    private final MonteCarloService        monteCarloService;
    private final AccountService           accountService;

    public List<Insight> getInsights(Long userId) {

        // ── 1. Run quick simulation for context ──────
        SimulationResult sim = monteCarloService.simulate(
            new SimulationRequest(
                userId, userService.getStrategy(userId),
                10, 1_000,
                true, true, 0.06));

        // ── 2. Get dashboard summary ─────────────────
        var summary =
            summaryService.getDashboardSummary(userId);

        // ── 3. Build context once ────────────────────
        AdvisorContext ctx = AdvisorContext.builder()
            .userId(userId)
            .monthlyIncome(summary.monthlyIncome())
            .monthlyExpenses(summary.monthlyExpenses() == BigDecimal.valueOf(0)?summary.lastMonthlyExpenses() : summary.monthlyExpenses())
            .monthlySurplus(summary.monthlySurplus())
            .theoreticalSavingsRate(
                summary.theoreticalSavingsRate())
            .actualSavingsRate(summary.actualSavingsRate())
            .savingsGap(summary.savingsGap())
            .actuallySavedAmount(summary.actuallySavedAmount())
            .emergencyRunway(summary.emergencyRunway())
            .netWorth(summary.netWorth())
            .categoryBreakdown(summary.categoryBreakdown())
            .topSpendingCategory(summary.topSpendingCategory())
            .simulation(sim)
            .accountCount(
                accountService.getUserAccounts(userId).size())
            .build();

        // ── 4. Evaluate all rules ────────────────────
        List<Insight> insights = rules.stream()
            .filter(rule -> rule.evaluate(ctx))
            .map(rule -> rule.generateInsight(ctx))
            .collect(Collectors.toList());

        // ── 5. Sort: CRITICAL → WARNING → INFO → GOOD
        insights.sort(Comparator.comparingInt(
            i -> severityOrder(i.getSeverity())));

        return insights;
    }

    private int severityOrder(Insight.Severity s) {
        return switch (s) {
            case CRITICAL -> 0;
            case WARNING  -> 1;
            case INFO     -> 2;
            case GOOD     -> 3;
        };
    }
}
