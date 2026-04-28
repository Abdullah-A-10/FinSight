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

import com.finsight.finsight_backend.model.entity.Transaction;
import com.finsight.finsight_backend.model.entity.Transaction.Category;
import com.finsight.finsight_backend.model.entity.Transaction.TransactionType;
import com.finsight.finsight_backend.service.TransactionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // POST /api/transactions
    // body: { "userId":1, "sourceAccountId":1,"targetAccountId":2, "amount":1500,
    //   "type":"EXPENSE", "category":"FOOD",
    //   "description":"Lunch", "date":"2025-03-20" }
    @PostMapping
    public ResponseEntity<Transaction> add(
            @RequestBody AddTransactionRequest req) {
        Transaction tx = transactionService.addTransaction(
                req.userId(),
                req.sourceAccountId(),
                req.targetAccountId(),
                req.amount(),
                req.type(),
                req.category(),
                req.description(),
                LocalDate.parse(req.date()));

        if (req.type() == TransactionType.SAVINGS
                && req.targetAccountId() == null) {
            throw new RuntimeException("Target account required for savings");
        }
        return ResponseEntity.ok(tx);
    }

    // GET /api/transactions/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Transaction>> getAll(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                transactionService.getAll(userId));
    }

    // GET /api/transactions/user/{userId}/range
    // ?from=2025-03-01&to=2025-03-31
    @GetMapping("/user/{userId}/range")
    public ResponseEntity<List<Transaction>> getByRange(
            @PathVariable Long userId,
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(
                transactionService.getByDateRange(
                        userId,
                        LocalDate.parse(from),
                        LocalDate.parse(to)));
    }

    // DELETE /api/transactions/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {
        transactionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record AddTransactionRequest(
            Long userId,
            Long sourceAccountId,
            Long targetAccountId,
            BigDecimal amount,
            TransactionType type,
            Category category,
            String description,
            String date) {

    }
}
