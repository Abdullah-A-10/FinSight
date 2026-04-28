package com.finsight.finsight_backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;

import com.finsight.finsight_backend.model.DTO.LifeEventDTO;
import com.finsight.finsight_backend.model.DTO.SimulationRequest;
import com.finsight.finsight_backend.model.DTO.SimulationResult;
import com.finsight.finsight_backend.model.entity.LifeEvent;
import com.finsight.finsight_backend.model.entity.Strategy;
import com.finsight.finsight_backend.repository.LifeEventRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MonteCarloService {

    private final FinancialSummaryService summaryService;
    private final ProjectionService projectionService;
    private final AccountService accountService;
    private final LifeEventRepository lifeEventRepo;

    private static final int HISTOGRAM_BUCKETS = 20;

    public SimulationResult simulate(SimulationRequest req) {
        // 1. Inputs
        BigDecimal monthlySurplus = req.useSmoothed()
                ? summaryService.getSmoothedMonthlySurplus(req.userId())
                : summaryService.getRealMonthlySurplus(req.userId());

        BigDecimal startWealth = accountService.getNetWorth(req.userId()).max(BigDecimal.ZERO);

        // 2. Setup Real Return
        double nominalReturn = req.strategy().getExpectedReturn();
        double inflationRate = req.inflationRate();

        // Use the Real Mean Return to keep everything in "Today's PKR"
        double realMeanReturn = nominalReturn - inflationRate;
        double volatility = req.strategy().getVolatility();
        int years = req.years();
        int sims = req.simulations();
        double annualSurplus = monthlySurplus.doubleValue() * 12;

        // 3. Process Events
        List<LifeEvent> events = req.includeLifeEvents()
                ? lifeEventRepo.findByUserIdOrderByAtYearAsc(req.userId())
                : List.of();

        Map<Integer, List<LifeEvent>> eventsMap = new HashMap<>();
        for (LifeEvent e : events) {
            eventsMap.computeIfAbsent(e.getAtYear(), k -> new ArrayList<>()).add(e);
        }

        List<LifeEventDTO> eventDTOs = events.stream()
                .map(e -> new LifeEventDTO(
                e.getEventName(),
                e.getAtYear(),
                e.getLumpSumAmount() != null
                ? e.getLumpSumAmount().doubleValue()
                : null,
                e.getMonthlyDelta(),
                e.getIsPositive()
        ))
                .toList();

        // 4. Run Simulations
        double[] outcomes = IntStream.range(0, sims)
                .parallel()
                .mapToDouble(i -> runOneSimulation(
                startWealth.doubleValue(),
                annualSurplus,
                realMeanReturn, // Passing REAL return
                volatility,
                years,
                eventsMap))
                .sorted()
                .toArray();

        // Percentiles
        BigDecimal p10 = toBD(outcomes[(int) (sims * 0.10)]);
        BigDecimal p50 = toBD(outcomes[(int) (sims * 0.50)]);
        BigDecimal p90 = toBD(outcomes[(int) (sims * 0.90)]);

        // Nominal trajectory (account balance)
        List<BigDecimal> trajectory
                = projectionService.project(
                        req.userId(), monthlySurplus,
                        req.strategy(), years);

        // Real trajectory (purchasing power)
        List<BigDecimal> realTrajectory
                = projectionService.projectReal(
                        req.userId(), monthlySurplus,
                        req.strategy(), years, inflationRate);

        // Strategy comparison
        Map<Strategy, BigDecimal> comparison
                = projectionService.compareAll(
                        req.userId(), monthlySurplus, years);

        Map<Strategy, BigDecimal> comparisonReal
                = projectionService.compareAllReal(
                        req.userId(), monthlySurplus, years, inflationRate);

        // Histogram
        List<Long> histogram
                = buildHistogram(outcomes, HISTOGRAM_BUCKETS);

        // Probability metrics
        Map<String, Double> probMetrics
                = buildProbabilityMetrics(outcomes);

        // Return complete result
        return new SimulationResult(
                p10, p50, p90,
                monthlySurplus, req.strategy(), years,
                trajectory,
                realTrajectory,
                comparison,
                comparisonReal,
                histogram,
                toBD(outcomes[0]),
                toBD(outcomes[sims - 1]),
                nominalReturn,
                inflationRate,
                realMeanReturn,
                probMetrics,
                eventDTOs
        );
    }

    private double runOneSimulation(
            double startWealth,
            double annualSurplus,
            double realMeanReturn,
            double volatility,
            int years,
            Map<Integer, List<LifeEvent>> eventsMap) {

        double wealth = startWealth;
        double curSurplus = annualSurplus;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int year = 1; year <= years; year++) {
            // 1. Process life events
            // We assume amounts are in "Today's Value" so no deflator is used.
            for (LifeEvent e : eventsMap.getOrDefault(year, List.of())) {
                if (e.getLumpSumAmount() != null) {
                    wealth += e.getLumpSumAmount().doubleValue();
                }
                if (e.getMonthlyDelta() != null) {
                    curSurplus += e.getMonthlyDelta().doubleValue() * 12;
                }
            }

            // 2. Generate Random Real Return
            double annualRealReturn = realMeanReturn + volatility * rng.nextGaussian();

            // Safety floor to prevent total wipeout from extreme volatility
            annualRealReturn = Math.max(annualRealReturn, -0.90);

            // 3. Compound and Add Surplus
            // Since wealth and surplus are in "Today's PKR" and return is "Real", 
            // we do NOT divide by a deflator.
            wealth = (wealth * (1.0 + annualRealReturn)) + curSurplus;

            // Wealth cannot be negative (simplified debt handling)
            wealth = Math.max(wealth, 0.0);
        }
        return wealth;
    }

    // ─────────────────────────────────────────────
    // Probability of reaching PKR targets
    // Uses binary search on sorted outcomes 
    // ─────────────────────────────────────────────
    private Map<String, Double> buildProbabilityMetrics(
            double[] sorted) {

        Map<String, Double> metrics = new LinkedHashMap<>();
        int total = sorted.length;

        Map<String, Double> targets = new LinkedHashMap<>();
        targets.put("500K", 500_000.0);
        targets.put("1M", 1_000_000.0);
        targets.put("2M", 2_000_000.0);
        targets.put("5M", 5_000_000.0);
        targets.put("10M", 10_000_000.0);

        for (Map.Entry<String, Double> e : targets.entrySet()) {
            double target = e.getValue();
            int lo = 0, hi = total;
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                if (sorted[mid] < target) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }
            double prob
                    = (double) (total - lo) / total;
            metrics.put(e.getKey(),
                    Math.round(prob * 1000.0) / 10.0);
        }
        return metrics;
    }

    // ─────────────────────────────────────────────
    // Histogram builder — 20 buckets
    // ─────────────────────────────────────────────
    private List<Long> buildHistogram(double[] sorted, int buckets) {
        if (sorted == null || sorted.length == 0 || buckets <= 0) {
            return Collections.emptyList();
        }

        double min = sorted[0];
        // Adaptive percentile: use 99th for volatile, 95th for stable; here we default to 99%
        int idxPercentile = (int) (sorted.length * 0.99);
        double max = sorted[Math.min(idxPercentile, sorted.length - 1)];

        // Ensure step > 0 (handle uniform values)
        if (max <= min) {
            max = min + 1.0;
        }

        double step = (max - min) / buckets;
        long[] counts = new long[buckets];

        for (double v : sorted) {
            int idx = v >= max ? buckets - 1 : (int) ((v - min) / step);
            counts[Math.min(Math.max(idx, 0), buckets - 1)]++;
        }

        List<Long> result = new ArrayList<>(buckets);
        for (long c : counts) {
            result.add(c);
        }
        return result;
    }

    private BigDecimal toBD(double v) {
        return BigDecimal.valueOf(v)
                .setScale(2, RoundingMode.HALF_UP);
    }

}
