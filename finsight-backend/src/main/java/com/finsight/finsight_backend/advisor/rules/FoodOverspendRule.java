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
import com.finsight.finsight_backend.service.TransactionService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor

public class FoodOverspendRule implements Rule {

    private final BudgetRepository budgetRepo;
    private final TransactionService transactionService;

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        // if user has set a FOOD budget, skip this rule
        // BudgetOverspendRule handles it more precisely
        LocalDate now = LocalDate.now();
        boolean hasBudget = budgetRepo
            .findByUserIdAndCategoryAndMonthAndYear(
                ctx.getUserId(), Category.FOOD,
                now.getMonthValue(), now.getYear())
            .isPresent();

        if (hasBudget) return false; // defer to BudgetOverspendRule

        // fallback to heuristic if no budget set
        BigDecimal food = ctx.getCategoryBreakdown()
            .getOrDefault(Category.FOOD, BigDecimal.ZERO);
        if (ctx.getMonthlyExpenses()
               .compareTo(BigDecimal.ZERO) == 0) return false;

        BigDecimal pct = food.divide(
            ctx.getMonthlyExpenses(), 2, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
        return pct.compareTo(BigDecimal.valueOf(30)) > 0;
    }
    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        BigDecimal food =
            ctx.getCategoryBreakdown()
               .getOrDefault(Category.FOOD, BigDecimal.ZERO);
        BigDecimal recommended =
            ctx.getMonthlyExpenses()
               .multiply(BigDecimal.valueOf(0.25));
        BigDecimal overshoot =
            food.subtract(recommended).max(BigDecimal.ZERO);
        return Insight.builder()
            .title("Food & dining is your biggest expense")
            .message(String.format(
                "You spent PKR %,.0f on food this month — " +
                "over 30%% of your total expenses. " +
                "Reducing by PKR %,.0f would bring you " +
                "to a healthy 25%% allocation.",
                food, overshoot))
            .severity(Insight.Severity.WARNING)
            .category("spending")
            .actionableAmount(
                String.format("PKR %,.0f/mo", overshoot))
            .build();
    }
}