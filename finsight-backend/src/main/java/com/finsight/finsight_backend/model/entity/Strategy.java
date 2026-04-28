package com.finsight.finsight_backend.model.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Strategy {

    //                   expectedReturn  volatility
    CASH_ONLY            (0.025,         0.005),
    CONSERVATIVE         (0.055,         0.06 ),
    BALANCED             (0.09,          0.10 ),
    AGGRESSIVE           (0.13,          0.18 ),
    FIXED_DEPOSIT        (0.12,          0.01 );

    private final double expectedReturn;
    private final double volatility;
}