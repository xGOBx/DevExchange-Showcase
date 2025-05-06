using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using DevExchange.Server.Models.Image.Category;
using DevExchange.Server.Models.Image;
using DevExchange.Server.Models.UserValidation;
using DevExchange.Server.Models;
using DevExchange.Server.Controllers;

namespace DevExchange.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
		{
				public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

                public DbSet<ImageUploadModel> ImageUploads { get; set; }
                public virtual DbSet<UserAnswer> UserAnswer { get; set; }
                public DbSet<CategoryModel> Categories { get; set; }
                public DbSet<Question> Questions { get; set; }
                public DbSet<QuestionOption> QuestionOptions { get; set; }

                public DbSet<WebsiteConnectionModel> WebsiteConnections { get; set; }

                public DbSet<ClassificationQuizRole> ClassificationQuizRoles { get; set; }

                public DbSet<ClassificationQuizVerification> ClassificationQuizVerifications { get; set; }

                public DbSet<WebConnectRole> WebConnectRoles { get; set; }
                public DbSet<WebConnectVerification> WebConnectVerifications { get; set; }
      


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurations for CategoryModel
            modelBuilder.Entity<CategoryModel>()
                .HasMany(c => c.Questions)
                .WithOne(q => q.Category)
                .HasForeignKey(q => q.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

        
            // Configurations for QuestionOption
            modelBuilder.Entity<QuestionOption>()
                .Property(o => o.OptionText)
                .IsRequired();

            // Ensure string properties use NVARCHAR(MAX) for flexibility
            modelBuilder.Entity<Question>()
                .Property(q => q.QuestionKey)
                .HasMaxLength(255)
                .IsRequired();

            modelBuilder.Entity<Question>()
                .Property(q => q.QuestionText)
                .IsRequired();

            modelBuilder.Entity<CategoryModel>()
                .Property(c => c.CategoryName)
                .HasMaxLength(255)
                .IsRequired();

            modelBuilder.Entity<CategoryModel>()
                .Property(c => c.CreatedDate)
                .HasDefaultValueSql("GETUTCDATE()");
        }
    }
}

