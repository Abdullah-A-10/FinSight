package com.finsight.finsight_backend.model.entity;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LifeEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String eventName;        // "Wedding", "Car Purchase"
    private Integer atYear;          // years from now
    private BigDecimal lumpSumAmount; // one-time cost (negative)
    private BigDecimal monthlyDelta;  // recurring change after event
    private Boolean isPositive;       // income boost or expense?
}
