package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;
import com.finsight.finsight_backend.model.entity.Strategy;

@Component
public class StrategyUpgradeRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        if (ctx.getSimulation() == null) return false;

        var comparison =
            ctx.getSimulation().strategyComparison();
        if (comparison == null) return false;

        BigDecimal current  = comparison.getOrDefault(
            ctx.getSimulation().strategy(), BigDecimal.ZERO);
        BigDecimal aggressive = comparison.getOrDefault(
            Strategy.AGGRESSIVE, BigDecimal.ZERO);

        if (current.compareTo(BigDecimal.ZERO) == 0)
            return false;

        // only fire if AGGRESSIVE is 20%+ better than current
        BigDecimal upliftPct = aggressive
            .subtract(current)
            .divide(current, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        return upliftPct.compareTo(BigDecimal.valueOf(20)) > 0
            && ctx.getSimulation().strategy()
                  != Strategy.AGGRESSIVE;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {

        var nominal   = ctx.getSimulation().strategyComparison();
        var real      = ctx.getSimulation().realComparison();

        BigDecimal currentNominal = nominal.getOrDefault(
            ctx.getSimulation().strategy(), BigDecimal.ZERO);
        BigDecimal aggressiveNominal = nominal.getOrDefault(
            Strategy.AGGRESSIVE, BigDecimal.ZERO);
        BigDecimal aggressiveReal = real != null
            ? real.getOrDefault(Strategy.AGGRESSIVE, BigDecimal.ZERO)
            : BigDecimal.ZERO;

        BigDecimal gain = aggressiveNominal
            .subtract(currentNominal);

        // get probability of 5M under aggressive
        Double prob5M = ctx.getSimulation()
            .probabilityMetrics() != null
            ? ctx.getSimulation().probabilityMetrics()
                  .getOrDefault("5M", 0.0)
            : 0.0;

        return Insight.builder()
            .title("Switching strategy could add PKR "
                + String.format("%,.0f", gain))
            .message(String.format(
                "Your current strategy projects PKR %,.0f " +
                "in %d years. TrSwitching to AGGRESSIVE " +
                "projects PKR %,.0f nominal / PKR %,.0f real. " +
                "Your probability of reaching PKR 5M " +
                "under AGGRESSIVE is %.1f%%.",
                currentNominal,
                ctx.getSimulation().years(),
                aggressiveNominal,
                aggressiveReal,
                prob5M))
            .severity(Insight.Severity.INFO)
            .category("investing")
            .actionableAmount(
                String.format("+PKR %,.0f", gain))
            .build();
    }
}