function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({ 
    queries: getRows(ss.getSheetByName("Queries")), 
    comments: getRows(ss.getSheetByName("Comments")) 
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Handle Likes
  if (params.action === "like") {
    const sheet = ss.getSheetByName("Queries");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == params.queryID) {
        sheet.getRange(i + 1, 6).setValue((parseInt(data[i][5]) || 0) + 1);
        break;
      }
    }
    return ContentService.createTextOutput("Liked");
  }

  // 2. Handle New Posts (With Verification)
  if (params.sheetName === "Queries") {
    const memberSheet = ss.getSheetByName("Members");
    const members = memberSheet.getDataRange().getValues();
    let userName = "";
    
    // Check if email exists in Members sheet
    for (let i = 1; i < members.length; i++) {
      if (members[i][0].toLowerCase() === params.email.toLowerCase()) {
        userName = members[i][1]; // Get Name from column 2
        break;
      }
    }

    if (!userName) {
      return ContentService.createTextOutput("NOT_MEMBER").setMimeType(ContentService.MimeType.TEXT);
    }

    ss.getSheetByName("Queries").appendRow([
      new Date().getTime(), new Date(), userName, params.text, params.photoLink || "", 0
    ]);
    return ContentService.createTextOutput("SUCCESS");
  }

  // 3. Handle Comments (Open to all)
  if (params.sheetName === "Comments") {
    ss.getSheetByName("Comments").appendRow([params.queryID, new Date(), params.user, params.text]);
    return ContentService.createTextOutput("SUCCESS");
  }
}

function getRows(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data.shift();
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}
