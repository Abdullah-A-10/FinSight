package com.finsight.finsight_backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.finsight.finsight_backend.model.entity.LifeEvent;
import com.finsight.finsight_backend.model.entity.Strategy;
import com.finsight.finsight_backend.repository.LifeEventRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectionService {

    private final LifeEventRepository lifeEventRepo;
    private final AccountService accountService;

    // ─────────────────────────────────────────────
    // NOMINAL projection — raw account balance
    // ─────────────────────────────────────────────
    public List<BigDecimal> project(
            Long userId,
            BigDecimal monthlySurplus,
            Strategy strategy,
            int years) {

        BigDecimal wealth
                = accountService.getNetWorth(userId)
                        .max(BigDecimal.ZERO);

        List<LifeEvent> events
                = lifeEventRepo.findByUserIdOrderByAtYearAsc(userId);

        Map<Integer, List<LifeEvent>> eventMap = new HashMap<>();
        for (LifeEvent e : events) {
            eventMap.computeIfAbsent(
                    e.getAtYear(), k -> new ArrayList<>()).add(e);
        }

        List<BigDecimal> trajectory = new ArrayList<>();
        trajectory.add(round(wealth));

        BigDecimal rate = BigDecimal.valueOf(
                strategy.getExpectedReturn());
        BigDecimal annualSurplus
                = monthlySurplus.multiply(BigDecimal.valueOf(12));
        BigDecimal currentSurplus = annualSurplus;

        for (int y = 1; y <= years; y++) {

            // Apply life events
            for (LifeEvent e : eventMap.getOrDefault(y, List.of())) {
                if (e.getLumpSumAmount() != null) {
                    wealth = wealth.add(e.getLumpSumAmount());
                }
                if (e.getMonthlyDelta() != null) {
                    currentSurplus = currentSurplus.add(
                            e.getMonthlyDelta()
                                    .multiply(BigDecimal.valueOf(12)));
                }
            }

            // Add annual surplus (can be negative)
            wealth = wealth.add(currentSurplus);

            // Apply investment growth
            wealth = wealth.multiply(BigDecimal.ONE.add(rate));

            // Prevent unrealistic negative wealth
            if (wealth.compareTo(BigDecimal.ZERO) < 0) {
                wealth = BigDecimal.ZERO;
            }

            trajectory.add(round(wealth));
        }
        return trajectory;
    }

    // ─────────────────────────────────────────────
    // REAL projection — inflation-adjusted
    // divides each year's nominal value by
    // cumulative inflation to show purchasing power
    // ─────────────────────────────────────────────
    public List<BigDecimal> projectReal(
            Long userId,
            BigDecimal monthlySurplus,
            Strategy strategy,
            int years,
            double inflationRate) {

        List<BigDecimal> nominal
                = project(userId, monthlySurplus, strategy, years);

        List<BigDecimal> real = new ArrayList<>();
        for (int i = 0; i < nominal.size(); i++) {
            // deflate: realValue = nominal / (1+inflation)^i
            double deflator
                    = Math.pow(1.0 + inflationRate, i);
            real.add(nominal.get(i)
                    .divide(BigDecimal.valueOf(deflator),
                            2, RoundingMode.HALF_UP));
        }
        return real;
    }

    // ─────────────────────────────────────────────
    // Compare all 5 strategies at final year
    // ─────────────────────────────────────────────
    public Map<Strategy, BigDecimal> compareAll(
            Long userId,
            BigDecimal monthlySurplus,
            int years) {

        Map<Strategy, BigDecimal> result
                = new LinkedHashMap<>();
        for (Strategy s : Strategy.values()) {
            result.put(s,
                    project(userId, monthlySurplus, s, years)
                            .get(years));
        }
        return result;
    }

    /*─────────────────────────────────────────────
    Compare all 5 strategies — inflation-adjusted
    ─────────────────────────────────────────────*/
    public Map<Strategy, BigDecimal> compareAllReal(
            Long userId,
            BigDecimal monthlySurplus,
            int years,
            double inflationRate) {

        Map<Strategy, BigDecimal> result
                = new LinkedHashMap<>();
        for (Strategy s : Strategy.values()) {
            result.put(s,
                    projectReal(userId, monthlySurplus, s, years, inflationRate)
                            .get(years));
        }
        return result;
    }

    private BigDecimal round(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
