package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class HighExpenseRatioRule implements Rule {

    private static final BigDecimal THRESHOLD =
        BigDecimal.valueOf(80); // expenses > 80% of income

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        if (ctx.getMonthlyIncome()
               .compareTo(BigDecimal.ZERO) == 0)
            return false;

        BigDecimal expenseRatio = ctx.getMonthlyExpenses()
            .divide(ctx.getMonthlyIncome(),
                    4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        return expenseRatio.compareTo(THRESHOLD) > 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {

        BigDecimal expenseRatio = ctx.getMonthlyExpenses()
            .divide(ctx.getMonthlyIncome(),
                    4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        // how much needs to be cut to reach 70% ratio
        BigDecimal targetExpenses = ctx.getMonthlyIncome()
            .multiply(BigDecimal.valueOf(0.70));
        BigDecimal cutNeeded = ctx.getMonthlyExpenses()
            .subtract(targetExpenses)
            .max(BigDecimal.ZERO);

        // top spending category to target first
        String topCat = ctx.getTopSpendingCategory() != null
            ? ctx.getTopSpendingCategory().name()
                  .toLowerCase()
            : "discretionary";

        return Insight.builder()
            .title(String.format(
                "%.0f%% of income spent on expenses",
                expenseRatio))
            .message(String.format(
                "Your expenses consume %.0f%% of income — " +
                "leaving little room for saving or investing. " +
                "Reducing by PKR %,.0f/month (targeting %s first) " +
                "would bring your expense ratio to a " +
                "healthier 70%%, freeing PKR %,.0f for wealth building.",
                expenseRatio, cutNeeded, topCat, cutNeeded))
            .severity(Insight.Severity.WARNING)
            .category("spending")
            .actionableAmount(
                String.format("PKR %,.0f/mo", cutNeeded))
            .build();
    }
}