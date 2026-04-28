package com.finsight.finsight_backend.model.DTO;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor

@Data
@Builder
public class LifeEventDTO {
    private String eventName;
    private Integer atYear;
    private Double lumpSumAmount;
    private BigDecimal monthlyDelta;  
    private Boolean isPositive;   
}