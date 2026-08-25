namespace RecruitmentBackend.DTOs.Responses
{
    public enum AiEvaluationRunOutcome
    {
        Completed,
        AlreadyCompleted,
        Cancelled,
        TransientFailed,
        PermanentFailed
    }

    public sealed record AiEvaluationRunResult(
        AiEvaluationRunOutcome Outcome,
        string? ErrorCode = null,
        string? ErrorMessage = null);
}
