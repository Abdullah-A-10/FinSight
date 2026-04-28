package com.finsight.finsight_backend.advisor.rules;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class NegativeRealReturnRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        if (ctx.getSimulation() == null) return false;
        return ctx.getSimulation().realReturn() < 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        double real     = ctx.getSimulation().realReturn() * 100;
        double nominal  = ctx.getSimulation().nominalReturn() * 100;
        double inflation= ctx.getSimulation().inflationRate() * 100;
        return Insight.builder()
            .title("Inflation is shrinking your real wealth")
            .message(String.format(
                "Your %.1f%% strategy return minus %.1f%% " +
                "inflation gives a real return of %.1f%%. " +
                "Your account balance grows but purchasing " +
                "power is shrinking. Consider AGGRESSIVE " +
                "or FIXED_DEPOSIT strategy.",
                nominal, inflation, real))
            .severity(Insight.Severity.CRITICAL)
            .category("investing")
            .build();
    }
}
