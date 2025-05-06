using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace DevExchange.Server.Models.UserValidation
{
  
    public class ClassificationQuizRole
    {
        [Key]
        [ForeignKey("AspNetUser")]  // Assuming your ASP.NET Identity user model is named 'AspNetUser'
        public string UserId { get; set; }  // Foreign key to the AspNetUsers table

        [Required]
        public bool IsTrustedClassificationQuiz { get; set; } = false;  // Represents the IsTrustedClassifictionQuiz column


    }

}
