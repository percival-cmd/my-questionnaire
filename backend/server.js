import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
    })
);

app.use(express.json());

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Quiz backend is running",
    });
});

app.post("/api/quiz-submit", async (req, res) => {
    try {
        const { score, total, answers, finalResponse } = req.body;

        if (
            typeof score !== "number" ||
            typeof total !== "number" ||
            !Array.isArray(answers)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz submission",
            });
        }

        const percentage =
            total > 0 ? Math.round((score / total) * 100) : 0;

        const answerRows = answers
            .map((item, index) => {
                return `
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">
              ${index + 1}
            </td>

            <td style="padding: 12px; border: 1px solid #ddd;">
              ${escapeHtml(item.question)}
            </td>

            <td style="padding: 12px; border: 1px solid #ddd;">
              ${escapeHtml(item.selectedAnswer || "Not answered")}
            </td>

            <td style="padding: 12px; border: 1px solid #ddd;">
              ${escapeHtml(item.correctAnswer)}
            </td>

            <td style="padding: 12px; border: 1px solid #ddd;">
              ${
                    item.correct
                        ? "✅ Correct"
                        : "❌ Wrong"
                }
            </td>
          </tr>
        `;
            })
            .join("");

        const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #1d1d1f;">

          <h2>📝 Quiz Submission</h2>

          <div
            style="
              background: #fff5f7;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 24px;
            "
          >
            <h3 style="margin-top: 0;">
              Score: ${score} / ${total}
            </h3>

            <p>
              Percentage: <strong>${percentage}%</strong>
            </p>
          </div>

          <h3>Answers</h3>

          <table
            style="
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            "
          >
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px; border: 1px solid #ddd;">
                  #
                </th>

                <th style="padding: 12px; border: 1px solid #ddd;">
                  Question
                </th>

                <th style="padding: 12px; border: 1px solid #ddd;">
                  Selected Answer
                </th>

                <th style="padding: 12px; border: 1px solid #ddd;">
                  Correct Answer
                </th>

                <th style="padding: 12px; border: 1px solid #ddd;">
                  Result
                </th>
              </tr>
            </thead>

            <tbody>
              ${answerRows}
            </tbody>
          </table>

          <h3 style="margin-top: 30px;">
            Additional Response
          </h3>

          <div
            style="
              background: #fafafa;
              border: 1px solid #eee;
              padding: 16px;
              border-radius: 10px;
              white-space: pre-wrap;
            "
          >
            ${escapeHtml(finalResponse || "No additional response")}
          </div>

        </body>
      </html>
    `;

        await transporter.sendMail({
            from: `"Quiz Dashboard" <${process.env.SMTP_USER}>`,
            to: process.env.MAIL_TO,
            subject: `Quiz Submission - ${score}/${total}`,
            html: emailHtml,
        });

        console.log("Quiz email sent successfully");

        return res.json({
            success: true,
            message: "Quiz submitted successfully",
        });
    } catch (error) {
        console.error("Email error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send quiz email",
        });
    }
});

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

app.listen(PORT, () => {
    console.log(`Quiz backend running on port ${PORT}`);
});