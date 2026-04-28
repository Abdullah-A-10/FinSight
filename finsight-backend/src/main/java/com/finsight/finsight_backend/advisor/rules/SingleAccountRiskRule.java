package com.finsight.finsight_backend.advisor.rules;

import org.springframework.stereotype.Component;

import com.finsight.finsight_backend.advisor.AdvisorContext;
import com.finsight.finsight_backend.advisor.Insight;
import com.finsight.finsight_backend.advisor.Rule;

@Component
public class SingleAccountRiskRule implements Rule {

    @Override
    public boolean evaluate(AdvisorContext ctx) {
        return ctx.getAccountCount() == 1;
    }

    @Override
    public Insight generateInsight(AdvisorContext ctx) {
        return Insight.builder()
            .title("All money in one account")
            .message("You only have one account. " +
                "Keep your emergency fund in a separate " +
                "savings account so you are not tempted " +
                "to spend it. Consider adding a " +
                "JazzCash or Meezan savings account.")
            .severity(Insight.Severity.WARNING)
            .category("savings")
            .build();
    }
}