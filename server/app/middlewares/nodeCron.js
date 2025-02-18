const cron = require("node-cron");
const { fetchAllCollectionsData } = require("../../database/middlewares/mongo");
const { sendEmail } = require("../middlewares/nodemailer");
const { getAllUsers, softDeleteUser } = require("../services/usersService");

const scheduleDailyEmail = () => {
  cron.schedule(
    "0 22 * * *",
    async () => {
      try {
        console.log("Cron job started at:", new Date());

        // Fetch data as JSON string
        const jsonData = await fetchAllCollectionsData();

        // Get current date for filename
        const currentDate = new Date().toISOString().split("T")[0];
        const fileName = `all_collections_data_${currentDate}.json`;

        // Send the email with JSON data as attachment
        const emailResult = await sendEmail(
          process.env.NODEMAILER_USER_EMAIL,
          "Daily Database Backup",
          "Please find attached the daily collections data.",
          "",
          [
            {
              filename: fileName,
              content: jsonData, // Send the JSON string directly as content
              contentType: "application/json",
            },
          ]
        );

        console.log("Email sent successfully:", emailResult.response);
      } catch (error) {
        console.error("Error during scheduled task:", error.message);
      } finally {
        console.log("Cron job finished at:", new Date());
      }
    },
    {
      timezone: "America/Chicago",
    }
  );

  console.log("Scheduled daily email at 10:00 PM CST.");
};

const scheduleSoftDeleteUsersCheck = () => {
  cron.schedule(
    "0 23 * * *", // Runs at 11pm every day
    async () => {
      try {
        console.log("Soft delete users cron job started at:", new Date());

        const users = await getAllUsers();
        const usersToSoftDelete = users.filter(
          (user) =>
            user.accountStatus === "deleted" && user.firebaseUserId !== null
        );

        for (const user of usersToSoftDelete) {
          try {
            await softDeleteUser(user._id.toString());
            console.log(
              `Successfully processed deleted user: ${user._id.toString()}`
            );
          } catch (error) {
            console.error(
              `Error processing deleted user ${user._id.toString()}:`,
              error.message
            );
          }
        }

        console.log(`Processed ${usersToSoftDelete.length} deleted users`);
      } catch (error) {
        console.error("Error during soft delete users check:", error.message);
      } finally {
        console.log("Soft delete users cron job finished at:", new Date());
      }
    },
    {
      timezone: "America/Chicago",
    }
  );
};

module.exports = {
  scheduleDailyEmail,
  scheduleSoftDeleteUsersCheck,
};
