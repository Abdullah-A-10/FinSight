package com.finsight.finsight_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finsight.finsight_backend.model.entity.FinancialProfile;

@Repository
public interface FinancialProfileRepository
        extends JpaRepository<FinancialProfile, Long> {

    // each user has exactly one profile
    Optional<FinancialProfile> findByUserId(Long userId);

    // check if profile already exists before creating
    boolean existsByUserId(Long userId);
}
