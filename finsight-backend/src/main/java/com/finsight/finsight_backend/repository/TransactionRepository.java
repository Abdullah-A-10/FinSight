package com.finsight.finsight_backend.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.finsight.finsight_backend.model.entity.Transaction;
import com.finsight.finsight_backend.model.entity.Transaction.Category;
import com.finsight.finsight_backend.model.entity.Transaction.TransactionType;

@Repository
public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    // all transactions for a user, newest first
    List<Transaction> findByUserIdOrderByDateDesc(Long userId);

    // transactions within a date range
    List<Transaction> findByUserIdAndDateBetween(
            Long userId, LocalDate from, LocalDate to);

    // transactions by category
    List<Transaction> findByUserIdAndCategory(
            Long userId, Category category);

    // total spent in a category this month — used by AI advisor
    @Query("""
        SELECT SUM(t.amount) FROM Transaction t
        WHERE t.user.id = :userId
        AND t.category = :category
        AND t.type = 'EXPENSE'
        AND MONTH(t.date) = :month
        AND YEAR(t.date) = :year
        """)
    BigDecimal sumByUserCategoryAndMonth(
            Long userId, Category category,
            int month, int year);

    // total income this month
    @Query("""
        SELECT SUM(t.amount) FROM Transaction t
        WHERE t.user.id = :userId
        AND t.type = :type
        AND MONTH(t.date) = :month
        AND YEAR(t.date) = :year
        """)
    BigDecimal sumByUserTypeAndMonth(
            Long userId, TransactionType type,
            int month, int year);

    // total savings
    @Query("""
        SELECT SUM(t.amount) FROM Transaction t
        WHERE t.user.id = :userId
        AND t.type = 'SAVINGS'
        """)
    BigDecimal sumSavingsByUser(
            Long userId);
}
