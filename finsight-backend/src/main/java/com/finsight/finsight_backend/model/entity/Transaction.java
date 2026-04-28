package com.finsight.finsight_backend.model.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;   // which account this transaction came from

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private TransactionType type; // INCOME or EXPENSE

    @Enumerated(EnumType.STRING)
    private Category category;

    private String description;

    @Column(nullable = false)
    private LocalDate date;

    public enum TransactionType { INCOME, EXPENSE , SAVINGS }

    public enum Category {

    // expense categories
    FOOD,
    TRANSPORT,
    HOUSING,
    HEALTH,
    EDUCATION,
    ENTERTAINMENT,
    SHOPPING,
    UTILITIES,
    OTHER,

    // income categories
    SALARY,
    FREELANCE,
    BUSINESS,
    RENTAL,

    // savings & investment 
    // user logs "I moved PKR 20k to savings" as this type
    SAVINGS,
    INVESTMENT
   }
}