using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CountriesWebApp.Migrations.UserDb
{
    /// <inheritdoc />
    public partial class AddBestScoreToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BestScore",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BestScore",
                table: "Users");
        }
    }
}
