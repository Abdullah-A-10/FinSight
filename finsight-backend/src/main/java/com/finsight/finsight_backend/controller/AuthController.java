package com.finsight.finsight_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finsight.finsight_backend.model.entity.User;
import com.finsight.finsight_backend.security.JwtUtil;
import com.finsight.finsight_backend.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    // POST /api/auth/register
    // body: { "fullName":"Ali", "email":"ali@x.com",
    //         "password":"pass123" }
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody AuthRequest req) {
        userService.register(
            req.fullName(), req.email(), req.password());

        // auto-login after register
        String token = jwtUtil.generateToken(req.email());
        User user = userService.findByEmail(req.email()).get();
        return ResponseEntity.ok(
            new AuthResponse(token, req.email(),user.getFullName(), user.getId()));
    }

    // POST /api/auth/login
    // body: { "email":"ali@x.com", "password":"pass123" }
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody AuthRequest req) {
        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    req.email(), req.password()));

            String token = jwtUtil.generateToken(req.email());
            User user = userService.findByEmail(req.email()).get();
            return ResponseEntity.ok(
                new AuthResponse(token, req.email() ,user.getFullName(), user.getId()));

        } catch (AuthenticationException e) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body("Invalid email or password");
        }
    }

    public record AuthRequest(
        String fullName,
        String email,
        String password) {}

    public record AuthResponse(
        String token,
        String email,
        String fullName,
        Long userID) {}
}
