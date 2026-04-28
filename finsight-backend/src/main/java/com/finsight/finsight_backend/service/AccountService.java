package com.finsight.finsight_backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;

import com.finsight.finsight_backend.model.entity.Account;
import com.finsight.finsight_backend.model.entity.Transaction;
import com.finsight.finsight_backend.model.entity.User;
import com.finsight.finsight_backend.repository.AccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserService userService;

    // =========================
    // CREATE ACCOUNT
    // =========================
    public Account createAccount(AccountRequest req) {
        User user = userService.findById(req.userId);

        boolean isFirst = accountRepository
                .findByUserId(req.userId).isEmpty();

        Account account = Account.builder()
                .user(user)
                .accountName(req.name)
                .accountType(req.type)
                .currentBalance(req.openingBalance)
                .annualReturnRate(
                        req.annualReturnRate != null
                                ? req.annualReturnRate
                                : BigDecimal.ZERO)
                .isDefault(isFirst)
                .lastUpdated(LocalDateTime.now())
                .build();

        return accountRepository.save(account);
    }

    // =========================
    // GET RAW ACCOUNTS (optional)
    // =========================
    public List<Account> getUserAccounts(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    // =========================
    // GET ACCOUNTS WITH GROWTH
    // =========================
    public List<AccountResponse> getUserAccountsWithGrowth(Long userId) {
        return accountRepository.findByUserId(userId)
                .stream()
                .map(acc -> {
                    BigDecimal effective = getEffectiveBalance(acc);
                    BigDecimal profit = effective.subtract(acc.getCurrentBalance());
                    BigDecimal profitPct = getProfitPercentage(acc, profit);

                    return new AccountResponse(
                            acc.getId(),
                            acc.getAccountName(),
                            acc.getAccountType().name(),
                            acc.getCurrentBalance(),
                            effective,
                            profit,
                            profitPct,
                            acc.getCurrency(),
                            acc.getIsDefault(),
                            acc.getAnnualReturnRate()
                    );
                })
                .toList();
    }

    // =========================
    // NET WORTH
    // =========================
    public BigDecimal getNetWorth(Long userId) {
        return accountRepository.findByUserId(userId)
                .stream()
                .map(this::getEffectiveBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // =========================
    // NET SAVINGS (GROWTH ACCOUNTS ONLY)
    // =========================
    public BigDecimal getNetSavings(Long userId) {
        return accountRepository.findByUserId(userId)
                .stream()
                .filter(Account::isGrowthAccount)
                .map(this::getEffectiveBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // =========================
    // ADJUST BALANCE (TRANSACTIONS)
    // =========================
    public void adjustBalance(Long accountId,
                             BigDecimal amount,
                             Transaction.TransactionType type) {

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (type == Transaction.TransactionType.INCOME) {
            account.setCurrentBalance(
                    account.getCurrentBalance().add(amount)
            );
        } else {
            BigDecimal newBalance =
                    account.getCurrentBalance().subtract(amount);

            if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Insufficient balance");
            }

            account.setCurrentBalance(newBalance);
        }

        // IMPORTANT: reset growth time
        account.setLastUpdated(LocalDateTime.now());

        accountRepository.save(account);
    }

    // =========================
    // EFFECTIVE BALANCE (WITH GROWTH)
    // =========================
    public BigDecimal getEffectiveBalance(Account account) {

        if (!account.isGrowthAccount()) {
            return account.getCurrentBalance();
        }

        BigDecimal rate = account.getAnnualReturnRate() != null
                ? account.getAnnualReturnRate()
                : BigDecimal.ZERO;

        if (rate.compareTo(BigDecimal.ZERO) == 0) {
            return account.getCurrentBalance();
        }

        long days = ChronoUnit.DAYS.between(
                account.getLastUpdated(),
                LocalDateTime.now()
        );

        if (days <= 0) {
            return account.getCurrentBalance();
        }

        BigDecimal years = BigDecimal.valueOf(days)
                .divide(BigDecimal.valueOf(365), 6, RoundingMode.HALF_UP);

        BigDecimal base = BigDecimal.ONE.add(rate);

        double pow = Math.pow(base.doubleValue(), years.doubleValue());

        return account.getCurrentBalance()
                .multiply(BigDecimal.valueOf(pow))
                .setScale(2, RoundingMode.HALF_UP);
    }

    // =========================
    // PROFIT
    // =========================
    public BigDecimal getProfit(Account account) {
        return getEffectiveBalance(account)
                .subtract(account.getCurrentBalance());
    }

    // =========================
    // PROFIT %
    // =========================
    public BigDecimal getProfitPercentage(Account account, BigDecimal profit) {

        if (account.getCurrentBalance().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return profit
                .divide(account.getCurrentBalance(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    // =========================
    // DTOs
    // =========================
    public record AccountResponse(
            Long id,
            String name,
            String type,
            BigDecimal currentBalance,
            BigDecimal effectiveBalance,
            BigDecimal profit,
            BigDecimal profitPercentage,
            String currency,
            Boolean isDefault,
            BigDecimal annualReturnRate
    ) {}

    public record AccountRequest(
            Long userId,
            String name,
            Account.AccountType type,
            BigDecimal openingBalance,
            BigDecimal annualReturnRate
    ) {}
}