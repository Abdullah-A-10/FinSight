package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class StrongSavingsRateRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        return ctx.getActualSavingsRate()
            .compareTo(BigDecimal.valueOf(25)) >= 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        return Insight.builder()
            .title("Excellent savings rate")
            .message(String.format(
                "You are saving %.1f%% of your income — " +
                "well above the 20%% target. Next milestone: " +
                "push to 30%% to accelerate your wealth " +
                "trajectory significantly.",
                ctx.getActualSavingsRate()))
            .severity(Insight.Severity.GOOD)
            .category("savings")
            .build();
    }
}