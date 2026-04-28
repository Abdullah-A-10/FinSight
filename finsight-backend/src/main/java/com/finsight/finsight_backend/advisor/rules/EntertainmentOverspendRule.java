package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;
import com.finsight.finsight_backend.model.entity.Transaction.Category;
import com.finsight.finsight_backend.repository.BudgetRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class EntertainmentOverspendRule implements Rule {

    private final BudgetRepository budgetRepo;

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        // 1. If user has set an ENTERTAINMENT budget, skip this rule
        // BudgetOverspendRule handles it more precisely
        LocalDate now = LocalDate.now();
        boolean hasBudget = budgetRepo
            .findByUserIdAndCategoryAndMonthAndYear(
                ctx.getUserId(), Category.ENTERTAINMENT,
                now.getMonthValue(), now.getYear())
            .isPresent();

        if (hasBudget) return false;

        // 2. Fallback to heuristic (based on % of total expenses)
        BigDecimal entertainment = ctx.getCategoryBreakdown()
            .getOrDefault(Category.ENTERTAINMENT, BigDecimal.ZERO);
            
        if (ctx.getMonthlyExpenses().compareTo(BigDecimal.ZERO) == 0) 
            return false;

        // Calculate % of total expenses
        BigDecimal pct = entertainment.divide(
            ctx.getMonthlyExpenses(), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        // Trigger if entertainment is > 10% of total expenses
        return pct.compareTo(BigDecimal.valueOf(10)) > 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        BigDecimal entertainment = ctx.getCategoryBreakdown()
            .getOrDefault(Category.ENTERTAINMENT, BigDecimal.ZERO);

        // Recommended max = 5% of total expenses
        BigDecimal recommended = ctx.getMonthlyExpenses()
            .multiply(BigDecimal.valueOf(0.05));

        BigDecimal overshoot = entertainment
            .subtract(recommended)
            .max(BigDecimal.ZERO);

        // Compounded impact over 5 years
        double compounded = overshoot.doubleValue() * 12 * 5;

        return Insight.builder()
            .title("Entertainment spending is higher than average")
            .message(String.format(
                "You spent PKR %,.0f on entertainment this month — " +
                "over 10%% of your total expenses. Trimming by " +
                "PKR %,.0f/month to the 5%% target would " +
                "free up PKR %,.0f over 5 years for investing.",
                entertainment, overshoot, compounded))
            .severity(Insight.Severity.WARNING)
            .category("spending")
            .actionableAmount(
                String.format("PKR %,.0f/mo", overshoot))
            .build();
    }
}