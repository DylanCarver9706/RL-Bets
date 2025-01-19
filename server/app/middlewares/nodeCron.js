const cron = require("node-cron");
const { fetchAllCollectionsData } = require("../../database/middlewares/mongo");
const { sendEmail } = require("../middlewares/nodemailer");
const { getTimestamp } = require("../utils/utils");

const scheduleDailyEmail = () => {
  cron.schedule(
    "0 22 * * *",
    async () => {
      try {
        console.log("Cron job started at:", getTimestamp());

        // Fetch data and generate JSON file
        const filePath = await fetchAllCollectionsData();
        console.log("Data fetched and saved to JSON file:", filePath);

        // Send the email
        const emailResult = await sendEmail(
          process.env.NODEMAILER_USER_EMAIL,
          "Daily Database Backup",
          "Please find attached the daily collections data.",
          [
            {
              filename: `all_collections_data_${getTimestamp().toISOString().split("T")[0]}.json`,
              path: filePath,
            },
          ]
        );

        console.log("Email sent successfully:", emailResult.response);
      } catch (error) {
        console.error("Error during scheduled task:", error.message);
      } finally {
        console.log("Cron job finished at:", getTimestamp());
      }
    },
    {
      timezone: "America/Chicago",
    }
  );

  console.log("Scheduled daily email at 5:18 PM CST.");
};

module.exports = { scheduleDailyEmail };
