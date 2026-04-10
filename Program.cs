using System;
using System.Diagnostics;
using Device.Core.Interfaces;
using Device.Core.SDK.Bioslim10;
using Device.Core.Services;
using M_One_IO;
using M_ONE_IO_service;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
Directory.SetCurrentDirectory(AppContext.BaseDirectory);
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite("Data Source=M_ONE_AIO.db"));
AppDbContext.InitializeDatabase();
// 1️⃣ Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "https://localhost:7180") // Sesuaikan dengan origin frontend Anda
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // <--- WAJIB DITAMBAHKAN
        });
});
builder.Services.AddSingleton<MrzOcrReader>(sp =>
{
    var basePath = AppContext.BaseDirectory;
    var tessPath = Path.Combine(basePath, "tessdata");
    return new MrzOcrReader(tessPath);
});

builder.Services.AddSingleton<PalmDeviceWrapper>();
builder.Services.AddSingleton<Sinosecu_passport_scanner>();
builder.Services.AddSingleton<NfcReader>();

///////////////////////////////////////////////////////
builder.Services.AddSingleton<IFingerprintWrapper, BioSlim10SDKWrapper>();
builder.Services.AddSingleton<IFingerPrintService, FingerprintService>();
builder.Services.AddSingleton<FingerprintService_Bridge>();
////////
builder.Services.AddControllers();
builder.Services.AddRazorPages(); // if present
var app = builder.Build();
app.Use(async (context, next) =>
{
    context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
    context.Response.Headers["Pragma"] = "no-cache";
    context.Response.Headers["Expires"] = "0";

    await next();
});
// 3️⃣ Apply CORS middleware **before controllers**
app.Services.GetRequiredService<FingerprintService_Bridge>();
app.UseCors("AllowFrontend");
app.UseStaticFiles();

// 4️⃣ Map controllers
app.MapControllers();
// 5️⃣ Run app
app.Run();
