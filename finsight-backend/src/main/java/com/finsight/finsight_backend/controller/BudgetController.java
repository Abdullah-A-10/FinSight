package com.finsight.finsight_backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finsight.finsight_backend.model.entity.Budget;
import com.finsight.finsight_backend.model.entity.Transaction.Category;
import com.finsight.finsight_backend.model.entity.User;
import com.finsight.finsight_backend.repository.BudgetRepository;
import com.finsight.finsight_backend.service.FinancialSummaryService;
import com.finsight.finsight_backend.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetRepository budgetRepo;
    private final UserService userService;
    private final FinancialSummaryService summaryService;

    // GET /api/budgets/user/{userId}?month=3&year=2026
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Budget>> getBudgets(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        LocalDate now = LocalDate.now();
        int m = month == 0 ? now.getMonthValue() : month;
        int y = year  == 0 ? now.getYear()       : year;

        return ResponseEntity.ok(
            budgetRepo.findByUserIdAndMonthAndYear(userId, m, y));
    }

    // POST /api/budgets
    @PostMapping
    public ResponseEntity<Budget> createOrUpdate(
            @RequestBody BudgetRequest req) {

        LocalDate now = LocalDate.now();
        int m = req.month() != null ? req.month() : now.getMonthValue();
        int y = req.year()  != null ? req.year()  : now.getYear();

        // update if exists, create if not
        Budget budget = budgetRepo
            .findByUserIdAndCategoryAndMonthAndYear(
                req.userId(), req.category(), m, y)
            .orElse(new Budget());

        User user = userService.findById(req.userId());
        budget.setUser(user);
        budget.setCategory(req.category());
        budget.setMonthlyLimit(req.monthlyLimit());
        budget.setMonth(m);
        budget.setYear(y);

        return ResponseEntity.ok(budgetRepo.save(budget));
    }

    // DELETE /api/budgets/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        budgetRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/budgets/user/{userId}/status
    // returns each category: limit, spent, remaining, % used
    @GetMapping("/user/{userId}/status")
    public ResponseEntity<List<BudgetStatus>> getBudgetStatus(
            @PathVariable Long userId) {

        LocalDate now = LocalDate.now();
        List<Budget> budgets = budgetRepo
            .findByUserIdAndMonthAndYear(
                userId,
                now.getMonthValue(),
                now.getYear());

        List<BudgetStatus> status = budgets.stream()
            .map(b -> {
                BigDecimal spent = summaryService
                    .getCategorySpend(
                        userId, b.getCategory(),
                        now.getMonthValue(), now.getYear());
                BigDecimal limit     = b.getMonthlyLimit();
                BigDecimal remaining = limit.subtract(spent)
                                           .max(BigDecimal.ZERO);
                double pct = limit.compareTo(BigDecimal.ZERO) == 0
                    ? 0
                    : spent.divide(limit, 4,
                        java.math.RoundingMode.HALF_UP)
                           .multiply(BigDecimal.valueOf(100))
                           .doubleValue();
                return new BudgetStatus(
                    b.getId(),
                    b.getCategory().name(),
                    limit, spent, remaining,
                    Math.min(pct, 100.0),
                    pct > 100.0
                );
            })
            .toList();

        return ResponseEntity.ok(status);
    }

    public record BudgetRequest(
        Long       userId,
        Category   category,
        BigDecimal monthlyLimit,
        Integer    month,
        Integer    year
    ) {}

    public record BudgetStatus(
        Long       id,
        String     category,
        BigDecimal limit,
        BigDecimal spent,
        BigDecimal remaining,
        double     percentUsed,
        boolean    isOverBudget
    ) {}
}