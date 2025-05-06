using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DevExchange.Server.Models.UserValidation
{
    /// <summary>
    /// Represents the user in the application, inheriting from IdentityUser.
    /// </summary>
    public class User : IdentityUser
    {
        /// <summary>
        /// Gets or sets the name of the user.
        /// </summary>
        [MaxLength(50)]
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the user was created.
        /// </summary>
        [Column(TypeName = "datetime")]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        /// <summary>
        /// Gets or sets the date and time when the user's information was last modified.
        /// </summary>
        [Column(TypeName = "datetime")]
        public DateTime ModifiedDate { get; set; } = DateTime.Now;

        /// <summary>
        /// Gets or sets the date and time when the user last logged in.
        /// </summary>
        [Column(TypeName = "datetime")]
        public DateTime LastLogin { get; set; } = DateTime.Now;

        /// <summary>
        /// Gets or sets a value indicating whether the user has administrator privileges.
        /// </summary>
        public bool IsAdmin { get; set; } = false;


    }
}
