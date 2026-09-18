import "dotenv/config";
import app from "./app";
import connectDB from "./configs/db";

const startServer = async () => {
  try {
    await connectDB();

    const port = Number(process.env.PORT) || 5000;
    app.listen(port, () => {
      console.log(`LeadFlow API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to start API:", error);
    process.exit(1);
  }
};

void startServer();
