using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DevExchange.Server.Models.UserValidation
{
    public class WebConnectRole
    {

        [Key]
        [ForeignKey("AspNetUser")]  // Assuming your ASP.NET Identity user model is named 'AspNetUser'
        public string UserId { get; set; }  // Foreign key to the AspNetUsers table

        [Required]
        public bool IsTrustedWebConnect { get; set; } = false;  // Represents the IsTrustedClassifictionQuiz column

    }
}
