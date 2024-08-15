import { pgTable, text, varchar, serial } from "drizzle-orm/pg-core";

export const MockInterview = pgTable('mockInterview', {
  id: serial('id').primaryKey(), // Assuming this is a UUID
  jsonMockResp: text('jsonMockResp').notNull(),
  jobPosition: varchar('jobPosition').notNull(),
  jobDesc: varchar('jobDesc').notNull(),
  jobExperience: varchar('jobExperience').notNull(),
  createdBy: varchar('createdBy').notNull(),
  createdAt: varchar('createdAt'),
  mockId: varchar('mockId').notNull() // Assuming this is a UUID
});

export const UserAnswer = pgTable('userAnswer', {
  code: serial('code').primaryKey(), // Assuming this is a UUID
  mockIdRef: varchar('mockId').notNull(), // Assuming this should be a UUID
  question: varchar('question').notNull(),
  correctAns: text('correctAns'),
  userAns: text('userAns'),
  feedback: text('feedback'),
  rating: varchar('rating'), // Or use appropriate type if it's numeric
  userEmail: varchar('userEmail'),
  createdAt: varchar('createdAt')
});

