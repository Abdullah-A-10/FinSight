package com.finsight.finsight_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finsight.finsight_backend.model.entity.Strategy;
import com.finsight.finsight_backend.model.entity.User;
import com.finsight.finsight_backend.service.UserService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // REGISTER USER
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest req) {

        User user = userService.register(
                req.fullName(),
                req.email(),
                req.password()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(mapToResponse(user));
    }

    //update strategy
    @PostMapping("/strategy")
    public User updateStrategy(
            @RequestParam Long userId,   
            @RequestBody Strategy strategy
    ) {
        return userService.updateStrategy(userId, strategy);
    }

    //get strategy
    @GetMapping("/strategy")
    public Strategy getStrategy(
            @RequestParam Long userId
    ) {
        return userService.getStrategy(userId);
        
    }
   
    // GET USER BY ID
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(
            @PathVariable Long id) {

        User user = userService.findById(id);
        return ResponseEntity.ok(mapToResponse(user));
    }

   
    // MAPPING (Entity → DTO)
    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail()
        );
    }

    // REQUEST DTO
    public record RegisterRequest(

            @NotBlank(message = "Full name is required")
            String fullName,

            @Email(message = "Invalid email format")
            @NotBlank(message = "Email is required")
            String email,

            @NotBlank(message = "Password is required")
            String password

    ) {}

    // RESPONSE DTO 
    public record UserResponse(
            Long id,
            String fullName,
            String email
    ) {}
}