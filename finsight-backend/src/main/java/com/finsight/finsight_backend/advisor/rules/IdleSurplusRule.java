package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class IdleSurplusRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        return ctx.getMonthlySurplus()
                  .compareTo(BigDecimal.valueOf(5000)) > 0
            && ctx.getActualSavingsRate()
                  .compareTo(BigDecimal.valueOf(5)) < 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        return Insight.builder()
            .title("Surplus sitting idle — not being invested")
            .message(String.format(
                "You have PKR %,.0f surplus each month " +
                "but are not logging any savings or " +
                "investments. Start a Meezan Mahana Amdani " +
                "or mutual fund SIP with even PKR 5,000/mo.",
                ctx.getMonthlySurplus()))
            .severity(Insight.Severity.INFO)
            .category("investing")
            .actionableAmount("PKR 5,000/mo minimum")
            .build();
    }
}