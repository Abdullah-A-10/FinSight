package com.finsight.finsight_backend.exception;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // user not found → 404
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>>
            handleRuntime(RuntimeException ex) {

        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(errorBody(
                HttpStatus.NOT_FOUND,
                ex.getMessage()));
    }

    // illegal arguments → 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>>
            handleIllegalArg(IllegalArgumentException ex) {

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorBody(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()));
    }

    // any other unhandled exception → 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>>
            handleGeneral(Exception ex) {

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorBody(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong"));
    }

    private Map<String, Object> errorBody(
            HttpStatus status, String message) {
        return Map.of(
            "timestamp", LocalDateTime.now().toString(),
            "status",    status.value(),
            "error",     status.getReasonPhrase(),
            "message",   message
        );
    }
}