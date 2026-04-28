package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class LowSavingsRateCriticalRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        return ctx.getActualSavingsRate()
            .compareTo(BigDecimal.TEN) < 0
            && ctx.getMonthlyIncome()
                  .compareTo(BigDecimal.ZERO) > 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        BigDecimal target =
            ctx.getMonthlyIncome()
               .multiply(BigDecimal.valueOf(0.20));
        BigDecimal gap =
            target.subtract(ctx.getActuallySavedAmount())
                  .max(BigDecimal.ZERO);
        return Insight.builder()
            .title("Savings rate critically low")
            .message(String.format(
                "You are saving %.1f%% of your income. " +
                "The minimum recommended is 20%%. " +
                "You need to save an additional PKR %,.0f " +
                "per month to reach the target.",
                ctx.getActualSavingsRate(),
                gap))
            .severity(Insight.Severity.CRITICAL)
            .category("savings")
            .actionableAmount(
                String.format("PKR %,.0f/mo", gap))
            .build();
    }
}
