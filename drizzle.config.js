/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
      url: 'postgresql://accounts:IQtASE7Ria1b@ep-divine-hill-a57vycqv.us-east-2.aws.neon.tech/ai-mock-interview?sslmode=require',
    }
  };