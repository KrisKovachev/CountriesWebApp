using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CountriesWebApp.Migrations.UserDb
{
    /// <inheritdoc />
    public partial class AddFlagQuizScore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FlagQuizBestScore",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FlagQuizBestScore",
                table: "Users");
        }
    }
}
