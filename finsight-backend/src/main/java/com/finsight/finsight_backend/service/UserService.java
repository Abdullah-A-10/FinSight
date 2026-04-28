package com.finsight.finsight_backend.service;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.finsight.finsight_backend.model.entity.Strategy;
import com.finsight.finsight_backend.model.entity.User;
import com.finsight.finsight_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // register new user
    public User register(String fullName,
                         String email,
                         String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException(
                "Email already registered: " + email);
        }
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .build();
        return userRepository.save(user);
    }

    public User updateStrategy(Long userId, Strategy strategy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (strategy != null) {
            user.setFinancial_Strategy(strategy);
        }
        return userRepository.save(user);
    }

    public Strategy getStrategy(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getFinancial_Strategy();
    }


    // find user by email — used by Spring Security
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // find user by id — used by all other services
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                    "User not found: " + id));
    }
}