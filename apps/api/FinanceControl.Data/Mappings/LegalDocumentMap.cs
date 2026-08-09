using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class LegalDocumentMap : IEntityTypeConfiguration<LegalDocument>
    {
        public void Configure(EntityTypeBuilder<LegalDocument> builder)
        {
            builder.ToTable("LegalDocuments");
            builder.HasKey(d => d.Id);

            builder.Property(d => d.Type)
                .HasConversion<string>()
                .IsRequired();

            builder.Property(d => d.Version).IsRequired();
            builder.Property(d => d.Content).IsRequired();

            builder.Property(d => d.ContentHash)
                .HasMaxLength(64)
                .IsRequired();

            builder.Property(d => d.PublishedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            // The pair is the identity of a document as far as everything else is
            // concerned — the seeder looks a version up by it, and it is what stops the
            // same version from being published twice.
            builder.HasIndex(d => new { d.Type, d.Version }).IsUnique();
        }
    }
}
