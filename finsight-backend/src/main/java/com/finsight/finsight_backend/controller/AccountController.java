package com.finsight.finsight_backend.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finsight.finsight_backend.model.entity.Account;
import com.finsight.finsight_backend.service.AccountService;
import com.finsight.finsight_backend.service.AccountService.AccountResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    // POST /api/accounts
    // body: { "userId":1, "name":"HBL Savings",
    //         "type":"BANK", "openingBalance":50000 }
    @PostMapping
    public ResponseEntity<Account> create(
            @RequestBody AccountService.AccountRequest req) {

        Account acc = accountService.createAccount(req);

        return ResponseEntity.ok(acc);
    }

    // GET /api/accounts/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AccountResponse>> getUserAccounts(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                accountService.getUserAccountsWithGrowth(userId));
    }

    // GET /api/accounts/networth/{userId}
    @GetMapping("/networth/{userId}")
    public ResponseEntity<BigDecimal> getNetWorth(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                accountService.getNetWorth(userId));
    }

    // GET /api/accounts/netSavings/{userId}
    @GetMapping("/netSavings/{userId}")
    public ResponseEntity<BigDecimal> getNetSavings(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                accountService.getNetSavings(userId));
    }

    public record CreateAccountRequest(
            Long userId,
            String name,
            Account.AccountType type,
            BigDecimal openingBalance) {

    }
}
