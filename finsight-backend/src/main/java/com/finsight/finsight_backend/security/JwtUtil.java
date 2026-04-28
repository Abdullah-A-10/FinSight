package com.finsight.finsight_backend.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    // min 256-bit secret — change this in production!
    private static final String SECRET =
        "finsight-super-secret-key-2025-minimum-256bits!";

    private static final long EXPIRY_MS =
        1000L * 60 * 60 * 24; // 24 hours

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    // generate token after successful login
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(
                    System.currentTimeMillis() + EXPIRY_MS))
                .signWith(getKey())
                .compact();
    }

    // extract email from token
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // validate token — returns false if expired or tampered
    public boolean isValid(String token) {
        try {
            Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}