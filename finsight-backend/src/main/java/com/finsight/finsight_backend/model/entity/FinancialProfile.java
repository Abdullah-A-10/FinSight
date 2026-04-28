package com.finsight.finsight_backend.model.entity;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private BigDecimal monthlyIncome;
    private BigDecimal currentSavings;
    private BigDecimal monthlyExpensesBudget;
    @Builder.Default
    private Integer projectionYears = 10;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskAppetite riskAppetite = RiskAppetite.BALANCED;

    public enum RiskAppetite {
        CONSERVATIVE, BALANCED, AGGRESSIVE
    }
}
