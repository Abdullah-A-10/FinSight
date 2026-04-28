package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class EmergencyFundLowRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        BigDecimal runway = ctx.getEmergencyRunway();
        return runway.compareTo(BigDecimal.ONE) >= 0
            && runway.compareTo(BigDecimal.valueOf(3)) < 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        BigDecimal sixMonths =
            ctx.getMonthlyExpenses()
               .multiply(BigDecimal.valueOf(6));
        return Insight.builder()
            .title("Emergency fund below 3 months")
            .message(String.format(
                "You have %.1f months of expenses saved. " +
                "Build this to 6 months (PKR %,.0f) " +
                "before increasing investments.",
                ctx.getEmergencyRunway(), sixMonths))
            .severity(Insight.Severity.WARNING)
            .category("savings")
            .actionableAmount(
                String.format("PKR %,.0f", sixMonths))
            .build();
    }
}