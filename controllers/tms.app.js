import axios from "axios";

let cachedAccessToken = null;
let tokenExpiryTime = 0;

export async function refreshAccessToken() {
  try {
    if (cachedAccessToken && Date.now() < tokenExpiryTime) {
      return cachedAccessToken; // Return cached token if not expired
    }
    const response = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.REFRESH_TOKEN,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: "refresh_token",
        },
      }
    );

    const { access_token, expires_in } = response.data;
    cachedAccessToken = access_token;
    tokenExpiryTime = Date.now() + expires_in * 1000;
    return access_token;
  } catch (error) {
    console.error("Failed to refresh Zoho access token", error);
    throw error;
  }
}

export async function getRecords(accessToken, reportName, criteria) {
  try {
    const response = await axios.get(
      `https://www.zohoapis.com/creator/v2.1/data/dhaqane/dlz/report/${reportName}?max_records=1000&criteria=${criteria}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log("Error getting records :" + error);
  }
}

export async function updateRecord(accessToken, data, id) {
  try {
    const formData = {
      data: data,
    };
    const response = await axios.patch(
      `https://www.zohoapis.com/creator/v2.1/data/dhaqane/dlz/report/All_Dispatch_Item_Costs/${id}`,
      formData,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating record:",
      error.response?.data || error.message
    );
    return { error: error.response?.data || error.message };
  }
}

export async function addRecord(accessToken, formName, data) {
  try {
    const formData = {
      data: data,
    };
    const response = await axios.post(
      `https://www.zohoapis.com/creator/v2.1/data/dhaqane/dlz/form/${formName}`,
      formData,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating record:",
      error.response?.data || error.message
    );
    return { error: error.response?.data || error.message };
  }
}

export async function exchangeCurrency(baseCurrency) {
  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.CURRENCY_API_KEY}/latest/${baseCurrency}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching currency");
    return { error: "Error fetching currency" };
  }
}
