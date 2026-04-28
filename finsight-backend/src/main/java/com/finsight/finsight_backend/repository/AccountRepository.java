package com.finsight.finsight_backend.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.finsight.finsight_backend.model.entity.Account;

@Repository
public interface AccountRepository
        extends JpaRepository<Account, Long> {

    // all accounts belonging to a user
    List<Account> findByUserId(Long userId);

    // user's default account
    Optional<Account> findByUserIdAndIsDefaultTrue(Long userId);

    // total net worth = sum of all account balances
    @Query("SELECT SUM(a.currentBalance) FROM Account a WHERE a.user.id = :userId")
    BigDecimal getTotalBalanceByUserId(Long userId);

    // total net savings = sum of all savings accounts balances
    @Query("SELECT SUM(a.currentBalance) FROM Account a WHERE a.user.id = :userId AND (a.accountType = 'SAVINGS' OR a.accountType='INVESTMENT' OR a.accountType = 'CRYPTO')")
    BigDecimal getTotalSavingsByUserId(Long userId);
}