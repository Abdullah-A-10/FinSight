package com.finsight.finsight_backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finsight.finsight_backend.model.DTO.SimulationRequest;
import com.finsight.finsight_backend.model.DTO.SimulationResult;
import com.finsight.finsight_backend.model.entity.Strategy;
import com.finsight.finsight_backend.service.FinancialSummaryService;
import com.finsight.finsight_backend.service.MonteCarloService;
import com.finsight.finsight_backend.service.ProjectionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/simulate")
@RequiredArgsConstructor
public class SimulationController {

    private final MonteCarloService      monteCarloService;
    private final ProjectionService      projectionService;
    private final FinancialSummaryService summaryService;

    // POST /api/simulate
    // Full 10,000-run Monte Carlo
    // body: { "userId":1, "strategy":"BALANCED",
    //   "years":10, "simulations":10000,
    //   "useSmoothed":true, "includeLifeEvents":true,
    //   "inflationRate":0.12 }
    @PostMapping
    public ResponseEntity<SimulationResult> simulate(
            @RequestBody SimulationRequest req) {
        return ResponseEntity.ok(
            monteCarloService.simulate(req));
    }

    // GET /api/simulate/quick/{userId}
    // 1,000 sims — fast dashboard preview
    @GetMapping("/quick/{userId}")
    public ResponseEntity<SimulationResult> quickSim(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0.12")
                double inflationRate) {
        SimulationRequest req = new SimulationRequest(
            userId, Strategy.BALANCED,
            10, 1_000, true, true, inflationRate);
        return ResponseEntity.ok(
            monteCarloService.simulate(req));
    }

    // GET /api/simulate/strategies/{userId}
    // Compare all 5 strategies at final year
    @GetMapping("/strategies/{userId}")
    public ResponseEntity<Map<Strategy, ?>> compareStrategies(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "10") int years) {
        var surplus =
            summaryService.getSmoothedMonthlySurplus(userId);
        return ResponseEntity.ok(
            projectionService.compareAll(userId, surplus, years));
    }
}