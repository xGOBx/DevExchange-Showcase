using Azure.Communication.Email;
using DevExchange.Server.Controllers;
using DevExchange.Server.Controllers.UploadManager;
using DevExchange.Server.Controllers.UserValidation;
using DevExchange.Server.Data;
using DevExchange.Server.Models.UserValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Swashbuckle.AspNetCore.SwaggerUI;

namespace DevExchange.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.WebHost.ConfigureKestrel(options =>
            {
                options.ListenAnyIP(80);
            });


            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddAuthorization();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddScoped<IUserValidationService, UserValidationService>();
            builder.Services.AddScoped<SecureWebsiteController>();
            builder.Services.AddScoped<IBlobStorageService>(provider =>
            {
                var configuration = provider.GetRequiredService<IConfiguration>();
                // No need to check connection string here as it's already checked in the constructor
                return new BlobStorageService(configuration);
            });


            // Database configuration for development, Docker, and production
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
            {
                if (builder.Environment.IsDevelopment())
                {
                    // Check if running in Docker
                    bool isRunningInDocker = Environment.GetEnvironmentVariable("RUNNING_IN_DOCKER") == "true";

                    if (isRunningInDocker)
                    {
                        // Use Docker SQL Server connection when running in Docker
                        var dockerConnectionString = builder.Configuration.GetConnectionString("DockerConnection");
                        options.UseSqlServer(dockerConnectionString, sqlServerOptions =>
                        {
                            sqlServerOptions.EnableRetryOnFailure(
                                maxRetryCount: 3,
                                maxRetryDelay: TimeSpan.FromSeconds(15),
                                errorNumbersToAdd: null);
                        });
                    }
                    else
                    {
                        // Use local SQL Server database for local development
                        var localConnectionString = builder.Configuration.GetConnectionString("LocalConnection");
                        options.UseSqlServer(localConnectionString, sqlServerOptions =>
                        {
                            sqlServerOptions.EnableRetryOnFailure(
                                maxRetryCount: 3,
                                maxRetryDelay: TimeSpan.FromSeconds(10),
                                errorNumbersToAdd: null);
                        });
                    }
                }
                else
                {
                    // Use Azure SQL Database connection string in production
                    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                    options.UseSqlServer(connectionString, sqlServerOptions =>
                    {
                        sqlServerOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                    });
                }
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("ReactApp", policyBuilder =>
                {
                    if (builder.Environment.IsDevelopment())
                    {
                        // Development CORS configuration
                        var devOrigins = builder.Configuration.GetSection("Cors:DevelopmentOrigins").Get<string[]>()
                            ?? new[] { "https://localhost:5173" }; // Default if not configured

                        policyBuilder
                            .WithOrigins(devOrigins)
                            .AllowAnyMethod()
                            .AllowAnyHeader()
                            .AllowCredentials();
                    }
                    else
                    {
                        // Production CORS configuration
                        var prodOrigins = builder.Configuration.GetSection("Cors:ProductionOrigins").Get<string[]>();

                        if (prodOrigins != null && prodOrigins.Length > 0)
                        {
                            policyBuilder
                                .WithOrigins(prodOrigins)
                                .AllowAnyMethod()
                                .AllowAnyHeader()
                                .AllowCredentials();
                        }
                        else
                        {
                            // Log a warning about missing configuration
                            var logger = builder.Services.BuildServiceProvider().GetRequiredService<ILogger<Program>>();
                            logger.LogWarning("No production CORS origins configured. CORS may not work as expected.");

                            // Set up a restrictive CORS policy if no origins are configured
                            policyBuilder
                                .AllowAnyMethod()
                                .AllowAnyHeader()
                                .AllowCredentials();
                        }
                    }
                });
            });



            builder.Services.ConfigureApplicationCookie(options =>
            {
                options.Cookie.Name = ".AspNetCore.Identity.Application";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.None; // Required for cross-origin
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.ExpireTimeSpan = TimeSpan.FromDays(30);
                options.SlidingExpiration = true;
            });


            builder.Services.AddIdentityApiEndpoints<User>(options => {
                options.SignIn.RequireConfirmedAccount = true;
                options.Password.RequireDigit = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 12;
                options.Password.RequiredUniqueChars = 1;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;
                options.User.AllowedUserNameCharacters =
                    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
                options.User.RequireUniqueEmail = true;
            })
              .AddEntityFrameworkStores<ApplicationDbContext>();




            var app = builder.Build();

            //// Configure uploads directory for Azure Web Apps
            //string uploadsPath;
            //if (app.Environment.IsProduction())
            //{
            //    // Use Azure Web Apps persistent storage
            //    uploadsPath = Path.Combine(Environment.GetEnvironmentVariable("HOME") ?? "", "site", "wwwroot", "uploads");
            //}
            //else
            //{
            //    uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            //}

            //if (!Directory.Exists(uploadsPath))
            //{
            //    Directory.CreateDirectory(uploadsPath);
            //}

            // Configure Swagger
            //if (app.Environment.IsDevelopment())
           
            app.UseSwagger();
            app.UseSwaggerUI();
           

            app.UseDefaultFiles();

            // Update static files configuration to remove the uploads directory
            app.UseStaticFiles(new StaticFileOptions
            {
                OnPrepareResponse = ctx =>
                {
                    if (app.Environment.IsDevelopment())
                    {
                        ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store");
                        ctx.Context.Response.Headers.Append("Pragma", "no-cache");
                        ctx.Context.Response.Headers.Append("Expires", "-1");
                    }
                    else
                    {
                        // Production security headers
                        ctx.Context.Response.Headers.Append("Cache-Control", "private, max-age=3600");
                        ctx.Context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
                        ctx.Context.Response.Headers.Append("X-Frame-Options", "DENY");
                        ctx.Context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
                    }
                }
            });

            // Always use HTTPS in production
            if (!app.Environment.IsDevelopment())
            {
                app.UseHsts();
                app.UseHttpsRedirection();

            }

            app.UseRouting();

            app.UseCors("ReactApp");

            app.UseAuthorization();
            app.MapIdentityApi<User>();
            app.MapControllers();

            app.MapFallbackToFile("index.html");

            app.Run();
        }
    }
}