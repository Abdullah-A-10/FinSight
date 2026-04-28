package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;
import com.finsight.finsight_backend.model.entity.LifeEvent;
import com.finsight.finsight_backend.model.entity.Strategy;
import com.finsight.finsight_backend.repository.LifeEventRepository;
import com.finsight.finsight_backend.service.FinancialSummaryService;
import com.finsight.finsight_backend.service.ProjectionService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class LifeGoalFeasibilityRule implements Rule {

    private final LifeEventRepository   lifeEventRepo;
    private final ProjectionService     projectionService;
    private final FinancialSummaryService summaryService;

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        // fires if user has at least one expense life event
        return lifeEventRepo
            .findByUserIdOrderByAtYearAsc(ctx.getUserId())
            .stream()
            .anyMatch(e -> !e.getIsPositive()
                && e.getLumpSumAmount() != null
                && e.getLumpSumAmount()
                       .compareTo(BigDecimal.ZERO) < 0);
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {

        List<LifeEvent> goals = lifeEventRepo
            .findByUserIdOrderByAtYearAsc(ctx.getUserId())
            .stream()
            .filter(e -> !e.getIsPositive()
                && e.getLumpSumAmount() != null
                && e.getLumpSumAmount()
                       .compareTo(BigDecimal.ZERO) < 0)
            .toList();

        BigDecimal surplus =
            summaryService.getSmoothedMonthlySurplus(
                ctx.getUserId());

        // get nominal trajectory up to max goal year
        int maxYear = goals.stream()
            .mapToInt(LifeEvent::getAtYear)
            .max().orElse(10);

        List<BigDecimal> trajectory =
            projectionService.project(
                ctx.getUserId(), surplus,
                Strategy.BALANCED, maxYear);

        // probability metrics from simulation if available
        Map<String, Double> probs =
            ctx.getSimulation() != null
                ? ctx.getSimulation().probabilityMetrics()
                : Map.of();

        List<String> achievable    = new ArrayList<>();
        List<String> tight         = new ArrayList<>();
        List<String> notAchievable = new ArrayList<>();

        for (LifeEvent goal : goals) {
            BigDecimal cost = goal.getLumpSumAmount()
                                  .abs();
            int atYear      = goal.getAtYear();

            // projected wealth at that year
            BigDecimal wealthAtYear = atYear < trajectory.size()
                ? trajectory.get(atYear)
                : trajectory.get(trajectory.size() - 1);

            // can they afford it?
            // wealth at that year must cover the cost
            BigDecimal affordabilityRatio = wealthAtYear
                .divide(cost, 4, RoundingMode.HALF_UP);

            // find earliest year they CAN afford it
            int earliestYear = -1;
            for (int y = 1; y < trajectory.size(); y++) {
                if (trajectory.get(y).compareTo(cost) >= 0) {
                    earliestYear = y;
                    break;
                }
            }

            String goalLine;

            if (affordabilityRatio.compareTo(
                    BigDecimal.valueOf(1.3)) >= 0) {
                // comfortable — wealth is 30%+ above cost
                goalLine = String.format(
                    "%s (Year %d, PKR %,.0f): " +
                    "ACHIEVABLE — projected wealth of " +
                    "PKR %,.0f gives you a %.0f%% " +
                    "cushion above the cost.",
                    goal.getEventName(), atYear,
                    cost,
                    wealthAtYear,
                    (affordabilityRatio.doubleValue() - 1) * 100
                );
                achievable.add(goalLine);

            } else if (affordabilityRatio.compareTo(
                    BigDecimal.ONE) >= 0) {
                // tight — wealth barely covers cost
                goalLine = String.format(
                    "%s (Year %d, PKR %,.0f): " +
                    "TIGHT — projected wealth of " +
                    "PKR %,.0f just covers this. " +
                    "Any market downturn could put it " +
                    "at risk. Consider PKR %,.0f " +
                    "extra savings/month.",
                    goal.getEventName(), atYear,
                    cost, wealthAtYear,
                    cost.subtract(wealthAtYear)
                        .divide(
                            BigDecimal.valueOf(atYear * 12L),
                            0, RoundingMode.CEILING)
                        .abs()
                );
                tight.add(goalLine);

            } else {
                // not achievable by target year
                String when = earliestYear > 0
                    ? String.format(
                        "earliest achievable at Year %d " +
                        "(delay of %d year%s)",
                        earliestYear,
                        earliestYear - atYear,
                        Math.abs(earliestYear - atYear) == 1
                            ? "" : "s")
                    : "not achievable within " +
                      maxYear + " years at current rate";

                // extra monthly savings needed
                BigDecimal shortfall =
                    cost.subtract(wealthAtYear)
                        .max(BigDecimal.ZERO);
                BigDecimal extraNeeded = shortfall
                    .divide(
                        BigDecimal.valueOf(atYear * 12L),
                        0, RoundingMode.CEILING);

                goalLine = String.format(
                    "%s (Year %d, PKR %,.0f): " +
                    "NOT ACHIEVABLE on time — " +
                    "projected wealth of PKR %,.0f " +
                    "is PKR %,.0f short. %s. " +
                    "Save an extra PKR %,.0f/month " +
                    "to stay on track.",
                    goal.getEventName(), atYear,
                    cost, wealthAtYear,
                    shortfall, when, extraNeeded
                );
                notAchievable.add(goalLine);
            }
        }

        // build final message
        StringBuilder msg = new StringBuilder();

        if (!notAchievable.isEmpty()) {
            msg.append("Goals at risk: ")
               .append(String.join(" | ", notAchievable))
               .append(". ");
        }
        if (!tight.isEmpty()) {
            msg.append("Goals that are tight: ")
               .append(String.join(" | ", tight))
               .append(". ");
        }
        if (!achievable.isEmpty()) {
            msg.append("Goals on track: ")
               .append(String.join(" | ", achievable))
               .append(".");
        }

        // add probability context if available
        if (!probs.isEmpty() && !notAchievable.isEmpty()) {
            // find the closest milestone probability
            // to the largest goal cost
            BigDecimal largestGoal = goals.stream()
                .map(e -> e.getLumpSumAmount().abs())
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

            String closestKey   = null;
            double closestDelta = Double.MAX_VALUE;

            for (Map.Entry<String, Double> e
                    : probs.entrySet()) {
                double target = parseProbKey(e.getKey());
                double delta  = Math.abs(
                    target - largestGoal.doubleValue());
                if (delta < closestDelta) {
                    closestDelta = delta;
                    closestKey   = e.getKey();
                }
            }

            if (closestKey != null) {
                msg.append(String.format(
                    " Based on 10,000 simulations, " +
                    "your probability of accumulating " +
                    "PKR %s is %.1f%%.",
                    closestKey,
                    probs.get(closestKey)));
            }
        }

        // severity based on how many are not achievable
        Insight.Severity severity = !notAchievable.isEmpty()
            ? Insight.Severity.CRITICAL
            : !tight.isEmpty()
            ? Insight.Severity.WARNING
            : Insight.Severity.GOOD;

        String title = !notAchievable.isEmpty()
            ? String.format(
                "%d of %d life goal%s at risk",
                notAchievable.size(), goals.size(),
                goals.size() == 1 ? "" : "s")
            : !tight.isEmpty()
            ? String.format(
                "%d life goal%s achievable but tight",
                tight.size(),
                tight.size() == 1 ? "" : "s")
            : String.format(
                "All ( %d ) life goal%s on track",
                goals.size(),
                goals.size() == 1 ? "" : "s");

        return Insight.builder()
            .title(title)
            .message(msg.toString())
            .severity(severity)
            .category("investing")
            .build();
    }

    // parse "500K" → 500000, "1M" → 1000000 etc.
    private double parseProbKey(String key) {
        try {
            if (key.endsWith("M"))
                return Double.parseDouble(
                    key.replace("M", "")) * 1_000_000;
            if (key.endsWith("K"))
                return Double.parseDouble(
                    key.replace("K", "")) * 1_000;
            return Double.parseDouble(key);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}