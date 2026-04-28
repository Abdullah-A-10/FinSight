package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;
import com.finsight.finsight_backend.model.entity.Transaction.Category;

@Component
public class TopSpendingCategoryRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        // only fire if we have category data
        return ctx.getTopSpendingCategory() != null
            && !ctx.getCategoryBreakdown().isEmpty()
            && ctx.getMonthlyExpenses()
                  .compareTo(BigDecimal.ZERO) > 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {

        Category top = ctx.getTopSpendingCategory();
        BigDecimal amount = ctx.getCategoryBreakdown()
            .getOrDefault(top, BigDecimal.ZERO);

        BigDecimal pct = amount
            .divide(ctx.getMonthlyExpenses(),
                    4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        // category-specific tip
        String tip = getCategoryTip(top);

        return Insight.builder()
            .title(String.format(
                "%s is your biggest spend this month",
                formatCategory(top)))
            .message(String.format(
                "You spent PKR %,.0f on %s — %.1f%% of " +
                "your total expenses this month. %s",
                amount,
                formatCategory(top).toLowerCase(),
                pct, tip))
            .severity(Insight.Severity.INFO)
            .category("spending")
            .actionableAmount(
                String.format("PKR %,.0f", amount))
            .build();
    }

    private String getCategoryTip(Category cat) {
        return switch (cat) {
            case FOOD ->
                "Try meal prepping or reducing dining out by 2 days/week.";
            case TRANSPORT ->
                "Consider carpooling or switching to weekly transport passes.";
            case HOUSING ->
                "Housing is often fixed — focus on reducing other categories.";
            case ENTERTAINMENT ->
                "Set a monthly entertainment budget and track it weekly.";
            case SHOPPING ->
                "Try a 48-hour rule before any non-essential purchase.";
            case HEALTH ->
                "Health spending is often necessary — check if any is avoidable.";
            default ->
                "Review this category to see if any spend can be reduced.";
        };
    }

    private String formatCategory(Category cat) {
        String name = cat.name();
        return name.charAt(0)
            + name.substring(1).toLowerCase().replace('_', ' ');
    }
}