package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class EmergencyFundCriticalRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        return ctx.getEmergencyRunway()
            .compareTo(BigDecimal.ONE) < 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        BigDecimal target =
            ctx.getMonthlyExpenses()
               .multiply(BigDecimal.valueOf(3));
        return Insight.builder()
            .title("Emergency fund critically low")
            .message(String.format(
                "You have less than 1 month of expenses " +
                "in savings. Stop all investing immediately " +
                "and build PKR %,.0f (3 months cover) first.",
                target))
            .severity(Insight.Severity.CRITICAL)
            .category("savings")
            .actionableAmount(
                String.format("PKR %,.0f", target))
            .build();
    }
}