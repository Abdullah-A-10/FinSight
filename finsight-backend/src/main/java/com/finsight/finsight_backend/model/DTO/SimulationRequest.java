package com.finsight.finsight_backend.model.DTO;

import com.finsight.finsight_backend.model.entity.Strategy;

public record SimulationRequest(
    Long    userId,
    Strategy strategy,
    Integer years,
    Integer simulations,
    Boolean useSmoothed,
    Boolean includeLifeEvents,
    Double  inflationRate    // e.g. 0.12 = 12%
) {
    public SimulationRequest {
        if (strategy         == null) strategy         = Strategy.BALANCED;
        if (years            == null) years            = 10;
        if (simulations      == null) simulations      = 10_000;
        if (useSmoothed      == null) useSmoothed      = true;
        if (includeLifeEvents== null) includeLifeEvents= true;
        if (inflationRate    == null) inflationRate    = 0.12;
    }
}