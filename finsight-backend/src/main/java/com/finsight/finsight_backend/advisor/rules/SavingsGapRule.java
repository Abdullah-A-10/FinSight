package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class SavingsGapRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        return ctx.getSavingsGap()
            .compareTo(BigDecimal.valueOf(15)) > 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        BigDecimal unaccounted =
            ctx.getMonthlySurplus()
               .subtract(ctx.getActuallySavedAmount())
               .max(BigDecimal.ZERO);
        return Insight.builder()
            .title("Large gap between potential and actual savings")
            .message(String.format(
                "You could save %.1f%% but are only saving %.1f%%. " +
                "PKR %,.0f per month is unaccounted — not logged " +
                "as savings or investment. Where is it going?",
                ctx.getTheoreticalSavingsRate(),
                ctx.getActualSavingsRate(),
                unaccounted))
            .severity(Insight.Severity.WARNING)
            .category("savings")
            .actionableAmount(
                String.format("PKR %,.0f", unaccounted))
            .build();
    }
}