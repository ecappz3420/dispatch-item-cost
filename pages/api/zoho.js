import {
  addRecord,
  getRecords,
  refreshAccessToken,
  updateRecord
} from "../../controllers/tms.app";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      try {
        const access_token = await refreshAccessToken();
        const { reportName, criteria } = req.query;
        if (!reportName) {
          return res.status(400).json({ message: "Report Name Not Found" });
        }
        const records = await getRecords(access_token, reportName, criteria);
        return res.status(200).json({ records });
      } catch (error) {
        return res.status(400).json({ message: "Error fetching record" });
      }
    } else if (req.method === "POST") {
      try {
        const access_token = await refreshAccessToken();
        const body = await req.body;
        const { formData, formName } = body;
        if (!formName || !formData) {
          return res.status(400).json({
            message: "Missing 'Form Name' or 'Form Data' in request body",
          });
        }
        const response = await addRecord(access_token, formName, formData);
        return res.status(200).json({ response });
      } catch (error) {
        return res.status(400).json({ message: "Error adding records" });
      }
    } else if (req.method === "PATCH") {
      try {
        const access_token = await refreshAccessToken();
        const body = await req.body;
        const { formData, id } = body;
        if (!id || !formData) {
          return res.status(400).json({
            message: "Missing 'ID' or 'Form Data' in request body",
          });
        }
        const response = await updateRecord(access_token, formData, id);
        return res.status(200).json({ response });
      } catch (error) {
        return res.status(400).json({ message: "Error updating records" });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching access token" });
  }
}
