package com.finsight.finsight_backend.model.DTO;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.finsight.finsight_backend.model.entity.Strategy;

public record SimulationResult(

    // ── Monte Carlo percentiles 
    BigDecimal p10,
    BigDecimal p50,
    BigDecimal p90,

    // ── Inputs used (for display) 
    BigDecimal monthlySurplus,
    Strategy   strategy,
    Integer    years,

    // ── Nominal trajectory (account balance)
    List<BigDecimal> trajectory,

    // ── Real trajectory (purchasing power) 
    List<BigDecimal> realTrajectory,

    // ── All 5 strategies compared 
    Map<Strategy, BigDecimal> strategyComparison,
    Map<Strategy, BigDecimal> realComparison, 

    // ── Histogram buckets for distribution chart 
    List<Long>   histogram,
    BigDecimal   histogramMin,
    BigDecimal   histogramMax,

    // ── Inflation breakdown 
    Double nominalReturn,   // strategy's raw return
    Double inflationRate,   // inflation used
    Double realReturn,      // nominalReturn - inflationRate

    // ── Probability of reaching targets 
    // e.g. { "1M": 84.6, "5M": 41.3 }
    Map<String, Double> probabilityMetrics,

    List<LifeEventDTO> lifeEvents

) {}

