package com.finsight.finsight_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finsight.finsight_backend.model.entity.LifeEvent;

@Repository
public interface LifeEventRepository
        extends JpaRepository<LifeEvent, Long> {

    // all events for a user, ordered by year
    List<LifeEvent> findByUserIdOrderByAtYearAsc(Long userId);

    // events happening at or after a given year
    List<LifeEvent> findByUserIdAndAtYearGreaterThanEqual(
            Long userId, int fromYear);
}