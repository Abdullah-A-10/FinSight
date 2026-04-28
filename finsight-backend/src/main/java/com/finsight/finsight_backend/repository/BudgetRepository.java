package com.finsight.finsight_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finsight.finsight_backend.model.entity.Budget;
import com.finsight.finsight_backend.model.entity.Transaction.Category;

@Repository
public interface BudgetRepository
        extends JpaRepository<Budget, Long> {

    // all budgets for a user in a given month
    List<Budget> findByUserIdAndMonthAndYear(
            Long userId, int month, int year);

    // specific category budget — used for overspend check
    Optional<Budget> findByUserIdAndCategoryAndMonthAndYear(
            Long userId, Category category,
            int month, int year);
}
