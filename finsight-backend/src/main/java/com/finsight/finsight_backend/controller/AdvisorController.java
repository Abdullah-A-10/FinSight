package com.finsight.finsight_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.service.RuleEngineService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/advisor")
@RequiredArgsConstructor
public class AdvisorController {

    private final RuleEngineService ruleEngineService;

    // GET /api/advisor/{userId}
    // returns all fired insights sorted by severity
    @GetMapping("/{userId}")
    public ResponseEntity<List<Insight>> getInsights(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
            ruleEngineService.getInsights(userId));
    }
}