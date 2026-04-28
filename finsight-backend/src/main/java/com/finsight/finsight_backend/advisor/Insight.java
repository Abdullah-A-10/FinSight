package com.finsight.finsight_backend.advisor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Insight {

    private String   title;
    private String   message;
    private Severity severity;
    private String   category;   // "savings","spending","investing"
    private String   actionableAmount; // e.g. "PKR 12,500"

    public enum Severity {
        CRITICAL, WARNING, INFO, GOOD
    }
}