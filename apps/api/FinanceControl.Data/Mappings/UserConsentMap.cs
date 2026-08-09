using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class UserConsentMap : IEntityTypeConfiguration<UserConsent>
    {
        public void Configure(EntityTypeBuilder<UserConsent> builder)
        {
            builder.ToTable("UserConsents");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.AcceptedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            // 45 is the longest an IPv6 address gets, including an embedded IPv4 tail.
            builder.Property(c => c.IpAddress).HasMaxLength(45);
            builder.Property(c => c.UserAgent).HasMaxLength(512);

            // Every read is "what has this user accepted" — the export and the
            // re-consent check both take that path.
            builder.HasIndex(c => c.UserId);

            builder.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Restrict, not cascade: a published version that someone signed must not be
            // deletable at all. Losing the text would leave the signature pointing at
            // nothing, which is the same as having no signature.
            builder.HasOne(c => c.LegalDocument)
                .WithMany(d => d.Consents)
                .HasForeignKey(c => c.LegalDocumentId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
