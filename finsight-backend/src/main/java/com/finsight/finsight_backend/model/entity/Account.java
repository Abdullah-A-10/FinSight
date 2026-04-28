package com.finsight.finsight_backend.model.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many accounts belong to one user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "account_name", nullable = false)
    private String accountName;        // e.g., "HBL Savings", "JazzCash"

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType;   // BANK, CASH, MOBILE_WALLET, INVESTMENT, CRYPTO

    @Column(name = "current_balance", nullable = false)
    private BigDecimal currentBalance;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "PKR";

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false; // one account can be primary/default

    @Column(name = "annual_return_rate")
    @Builder.Default
    private BigDecimal annualReturnRate = BigDecimal.ZERO; // e.g. 0.08 = 8%

    @Column(name = "last_updated")
    @Builder.Default
    private LocalDateTime lastUpdated = LocalDateTime.now();

    // Enum for account types
    public enum AccountType {
        BANK, CASH, MOBILE_WALLET, INVESTMENT, CRYPTO, SAVINGS
    }

    public boolean isGrowthAccount() {
        return this.accountType == AccountType.SAVINGS
                || this.accountType == AccountType.INVESTMENT
                || this.accountType == AccountType.CRYPTO;
    }
}
