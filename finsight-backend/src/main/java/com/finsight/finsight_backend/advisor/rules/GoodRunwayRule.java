package com.finsight.finsight_backend.advisor.rules;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class GoodRunwayRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        return ctx.getEmergencyRunway()
            .compareTo(BigDecimal.valueOf(6)) >= 0;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        return Insight.builder()
            .title("Emergency fund fully funded")
            .message(String.format(
                "You have %.1f months of expenses covered. " +
                "Your safety net is solid. You can now " +
                "confidently maximise your investment surplus " +
                "without financial risk.",
                ctx.getEmergencyRunway()))
            .severity(Insight.Severity.GOOD)
            .category("savings")
            .build();
    }
}