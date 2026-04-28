package com.finsight.finsight_backend.controller;

import com.finsight.finsight_backend.model.entity.LifeEvent;
import com.finsight.finsight_backend.model.entity.User;
import com.finsight.finsight_backend.repository.LifeEventRepository;
import com.finsight.finsight_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/life-events")
@RequiredArgsConstructor
public class LifeEventController {

    private final LifeEventRepository lifeEventRepo;
    private final UserService userService;

    // GET /api/life-events/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LifeEvent>> getAll(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
            lifeEventRepo.findByUserIdOrderByAtYearAsc(userId));
    }

    // POST /api/life-events
    @PostMapping
    public ResponseEntity<LifeEvent> create(
            @RequestBody CreateLifeEventRequest req) {
        User user = userService.findById(req.userId());
        LifeEvent event = LifeEvent.builder()
            .user(user)
            .eventName(req.eventName())
            .atYear(req.atYear())
            .lumpSumAmount(req.lumpSumAmount())
            .monthlyDelta(req.monthlyDelta())
            .isPositive(req.isPositive())
            .build();
        return ResponseEntity.ok(lifeEventRepo.save(event));
    }

    // DELETE /api/life-events/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        lifeEventRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateLifeEventRequest(
        Long       userId,
        String     eventName,
        Integer    atYear,
        BigDecimal lumpSumAmount,
        BigDecimal monthlyDelta,
        Boolean    isPositive
    ) {}
}