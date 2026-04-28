package com.finsight.finsight_backend.advisor.rules;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class HighInflationWarningRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        if (ctx.getSimulation() == null) return false;
        return ctx.getSimulation().inflationRate() > 0.10
            && ctx.getSimulation().realReturn() >= 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        double inf = ctx.getSimulation().inflationRate() * 100;
        return Insight.builder()
            .title("High inflation reducing real gains")
            .message(String.format(
                "With %.1f%% inflation your real returns are " +
                "significantly eroded. Consider AGGRESSIVE " +
                "or FIXED_DEPOSIT strategies which may " +
                "outpace inflation more reliably.", inf))
            .severity(Insight.Severity.WARNING)
            .category("investing")
            .build();
    }
}