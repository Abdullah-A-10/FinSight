package com.finsight.finsight_backend.advisor;

public interface Rule {

    /**
     * Should this rule fire for this context?
     * Return true if the condition is met.
     */
    boolean evaluate(AdvisorContext ctx);

    /**
     * Generate the insight to show the user.
     * Only called when evaluate() returns true.
     */
    Insight generateInsight(AdvisorContext ctx);
}