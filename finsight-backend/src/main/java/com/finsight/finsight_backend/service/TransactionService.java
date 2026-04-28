package com.finsight.finsight_backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finsight.finsight_backend.model.entity.Transaction;
import com.finsight.finsight_backend.model.entity.Transaction.Category;
import com.finsight.finsight_backend.model.entity.Transaction.TransactionType;
import com.finsight.finsight_backend.model.entity.User;
import com.finsight.finsight_backend.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserService userService;
    private final AccountService accountService;

    // log a new transaction + update account balance
    @Transactional
    public Transaction addTransaction(Long userId,
            Long sourceAccountId, // Account the money leaves
            Long targetAccountId, // Optional: Account the money enters
            BigDecimal amount,
            TransactionType type,
            Category category,
            String description,
            LocalDate date) {

        User user = userService.findById(userId);
        Transaction tx = Transaction.builder()
                .user(user)
                .amount(amount)
                .type(type)
                .category(category)
                .description(description)
                .date(date)
                .build();
        Transaction saved = transactionRepository.save(tx);

        if (type == TransactionType.SAVINGS && targetAccountId != null) {
            // 1. Deduct from Source (e.g., Checking)
            accountService.adjustBalance(sourceAccountId, amount, TransactionType.SAVINGS);

            // 2. Add to Target (e.g., Investment Account)
            //passing INCOME here so the adjustBalance method ADDS the money
            accountService.adjustBalance(targetAccountId, amount, TransactionType.INCOME);
        } else {
            // Normal Income or Expense flow
            accountService.adjustBalance(sourceAccountId, amount, type);
        }

        return saved;
    }

    // all transactions for a user — newest first
    public List<Transaction> getAll(Long userId) {
        return transactionRepository
                .findByUserIdOrderByDateDesc(userId);
    }

    // transactions in a date range
    public List<Transaction> getByDateRange(Long userId,
            LocalDate from,
            LocalDate to) {
        return transactionRepository
                .findByUserIdAndDateBetween(userId, from, to);
    }

    // monthly total for a given type (INCOME / EXPENSE)
    public BigDecimal getMonthlyTotal(Long userId,
            TransactionType type,
            int month,
            int year) {
        BigDecimal total = transactionRepository
                .sumByUserTypeAndMonth(userId, type, month, year);
        return total != null ? total : BigDecimal.ZERO;
    }

    // monthly spend in a specific category
    public BigDecimal getCategoryTotal(Long userId,
            Category category,
            int month,
            int year) {
        BigDecimal total = transactionRepository
                .sumByUserCategoryAndMonth(
                        userId, category, month, year);
        return total != null ? total : BigDecimal.ZERO;
    }

    //total Savings
    public BigDecimal getAllSavings(Long userId){
        return transactionRepository.sumSavingsByUser(userId);
    }

    // delete a transaction
    @Transactional
    public void delete(Long transactionId) {
        transactionRepository.deleteById(transactionId);
    }
}
