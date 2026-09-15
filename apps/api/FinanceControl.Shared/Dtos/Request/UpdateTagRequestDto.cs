namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateTagRequestDto
    {
        public string Name { get; set; }

        /// <summary>
        /// Absorb the tag into the existing one that already answers to this name, moving
        /// every transaction over. Without it a name clash is refused, because folding two
        /// tags together is not something a rename should do behind the user's back.
        /// </summary>
        public bool Merge { get; set; }
    }
}
