package com.finsight.finsight_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finsight.finsight_backend.model.entity.User;

@Repository
public interface UserRepository
        extends JpaRepository<User, Long> {

    // finds user by email — used for login
    Optional<User> findByEmail(String email);

    // checks if email already registered
    boolean existsByEmail(String email);
}