namespace DevExchange.Server.Controllers.EmailSender.CustomExceptionHandler
{
    public class EmailSendException : Exception
    {
        public EmailSendException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
