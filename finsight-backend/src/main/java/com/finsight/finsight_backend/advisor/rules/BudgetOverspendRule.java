package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;
import com.finsight.finsight_backend.model.entity.Budget;
import com.finsight.finsight_backend.model.entity.Transaction.Category;
import com.finsight.finsight_backend.repository.BudgetRepository;
import com.finsight.finsight_backend.service.TransactionService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BudgetOverspendRule implements Rule {

    private final BudgetRepository budgetRepo;
    private final TransactionService transactionService;

    // fires if ANY category is over its set budget limit
    @Override
    public boolean evaluate(AdvisorContext ctx) {
        LocalDate now = LocalDate.now();
        List<Budget> budgets = budgetRepo
            .findByUserIdAndMonthAndYear(
                ctx.getUserId(),
                now.getMonthValue(),
                now.getYear());

        if (budgets.isEmpty()) return false;

        return budgets.stream().anyMatch(b -> {
            BigDecimal spent = getSpent(
                ctx.getUserId(), b.getCategory(),
                now.getMonthValue(), now.getYear());
            return spent.compareTo(b.getMonthlyLimit()) > 0;
        });
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        LocalDate now = LocalDate.now();
        List<Budget> budgets = budgetRepo
            .findByUserIdAndMonthAndYear(
                ctx.getUserId(),
                now.getMonthValue(),
                now.getYear());

        // collect all over-budget categories
        List<String> overLines = new ArrayList<>();
        BigDecimal totalOvershoot = BigDecimal.ZERO;

        for (Budget b : budgets) {
            BigDecimal spent = getSpent(
                ctx.getUserId(), b.getCategory(),
                now.getMonthValue(), now.getYear());

            BigDecimal overshoot = spent
                .subtract(b.getMonthlyLimit());

            if (overshoot.compareTo(BigDecimal.ZERO) > 0) {
                totalOvershoot =
                    totalOvershoot.add(overshoot);

                // percentage over budget
                BigDecimal pct = overshoot
                    .divide(b.getMonthlyLimit(),
                            2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

                overLines.add(String.format(
                    "%s: PKR %,.0f over (%.0f%% above limit)",
                    b.getCategory().name(),
                    overshoot,
                    pct));
            }
        }

        // build message listing each over-budget category
        String details = String.join(", ", overLines);

        // 10-year compounding impact of the overshoot
        double compounded =
            totalOvershoot.doubleValue() * 12 * 10;

        return Insight.builder()
            .title(String.format(
                "%d budget limit%s exceeded this month",
                overLines.size(),
                overLines.size() == 1 ? "" : "s"))
            .message(String.format(
                "You have exceeded your set budget limits: %s. " +
                "Total overshoot is PKR %,.0f this month. " +
                "At this rate, that's PKR %,.0f less available " +
                "for investing over 10 years.",
                details,
                totalOvershoot,
                compounded))
            .severity(overLines.size() >= 2
                ? Insight.Severity.CRITICAL
                : Insight.Severity.WARNING)
            .category("spending")
            .actionableAmount(
                String.format("PKR %,.0f/mo over", totalOvershoot))
            .build();
    }

    private BigDecimal getSpent(
            Long userId, Category category,
            int month, int year) {
        BigDecimal spent = transactionService
            .getCategoryTotal(userId, category, month, year);
        return spent != null ? spent : BigDecimal.ZERO;
    }
}
