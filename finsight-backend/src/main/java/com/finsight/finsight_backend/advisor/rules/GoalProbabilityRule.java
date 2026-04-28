package com.finsight.finsight_backend.advisor.rules;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class GoalProbabilityRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        return ctx.getSimulation() != null
            && ctx.getSimulation().probabilityMetrics() != null;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        Map<String, Double> probs =
            ctx.getSimulation().probabilityMetrics();

        // find the most meaningful milestone (closest to 50%)
        String bestKey  = "1M";
        double bestDelta = Double.MAX_VALUE;
        for (Map.Entry<String, Double> e : probs.entrySet()) {
            double delta = Math.abs(e.getValue() - 50.0);
            if (delta < bestDelta) {
                bestDelta = delta;
                bestKey   = e.getKey();
            }
        }
        double prob = probs.get(bestKey);
        return Insight.builder()
            .title(String.format(
                "%.0f%% chance of reaching PKR %s",
                prob, bestKey))
            .message(String.format(
                "Based on 10,000 simulations, you have a " +
                "%.1f%% probability of reaching PKR %s " +
                "in %d years. Increasing your monthly " +
                "surplus by PKR 5,000 could raise this " +
                "probability by approximately 5-8%%.",
                prob, bestKey,
                ctx.getSimulation().years()))
            .severity(Insight.Severity.INFO)
            .category("investing")
            .build();
    }
}