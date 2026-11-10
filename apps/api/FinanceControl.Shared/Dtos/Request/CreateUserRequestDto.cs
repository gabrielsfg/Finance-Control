namespace FinanceControl.Shared.Dtos
{
    public class CreateUserRequestDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Name { get; set; }

        /// <summary>
        /// The account holder's CPF, digits or formatted. Only its HMAC is stored: it ties
        /// the free trial to the person, whatever card later pays.
        /// </summary>
        public string Cpf { get; set; }

        /// <summary>
        /// The consent itself. Refused when false, and the timestamp, address and document
        /// version are recorded server-side — the client says only that the box was ticked,
        /// never what was ticked, since that is the part that has to be trustworthy.
        /// </summary>
        public bool AcceptedTerms { get; set; }
    }
}
