namespace RecruitmentBackend.Exceptions;

public sealed class ChatbotUnavailableException : Exception
{
    public ChatbotUnavailableException(string userMessage, Exception? innerException = null)
        : base(userMessage, innerException)
    {
        UserMessage = userMessage;
    }

    public string UserMessage { get; }
}
