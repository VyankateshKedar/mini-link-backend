// utils/parseUserAgent.js
const UAParser = require("ua-parser-js");

const parseUserAgent = (userAgentString) => {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  // Determine device type
  let deviceType = "Desktop";
  if (result.device.type === "mobile") deviceType = "Mobile";
  else if (result.device.type === "tablet") deviceType = "Tablet";

  // Browser name
  const browser = result.browser.name || "Unknown";

  return { deviceType, browser };
};

module.exports = parseUserAgent;
