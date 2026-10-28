using AttendanceTracker.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AttendanceTracker.Api.Data;

public sealed class ApplicationDbContext
    : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<AttendanceAnnotation>
        AttendanceAnnotations =>
            Set<AttendanceAnnotation>();

    protected override void OnModelCreating(
        ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AttendanceAnnotation>(
            entity =>
            {
                entity.ToTable(
                    "AttendanceAnnotations");

                entity.HasKey(
                    annotation =>
                        annotation.Id);

                entity.Property(
                        annotation =>
                            annotation.EmpNo)
                    .HasMaxLength(10)
                    .IsRequired();

                entity.Property(
                        annotation =>
                            annotation.FieldName)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(
                        annotation =>
                            annotation.Reason)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(
                        annotation =>
                            annotation.CreatedByUserId)
                    .HasMaxLength(450);

                entity.HasIndex(
                        annotation =>
                            new
                            {
                                annotation.EmpNo,
                                annotation.AttendanceDate,
                                annotation.FieldName,
                            })
                    .IsUnique();
            }
        );
    }
}