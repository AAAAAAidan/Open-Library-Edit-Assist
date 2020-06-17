function doGet(e)
{
  var content = e.parameters.content.toString();
  return ContentService.createTextOutput(get(content));
}

function get(content)
{
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (content.length > 4)
  {
    sheet.getRange(2, 4, 14).clear({ formatOnly: false, contentsOnly: true });
    sheet.getRange(6, 4).setValue("isbn_13");
    
    var amznVars = sheet.getRange(2, 1, 14).getValues();
    content = content.split("OUTER");

    for (var i in content)
    {
      content[i] = content[i].split("INNER");
      var row = amznVars.findIndex(vars => {return vars[0] == content[i][0]});
      if (row != -1)
        sheet.getRange(row+2, 4).setValue(content[i][1]);
    }
    return "Done!";
  } else
  {
    var vals = sheet.getRange(2, 4, 14).getValues();

    if (content == "add")
      var olVars = sheet.getRange(2, 2, 6).getValues();
    else if (content == "edit")
      var olVars = sheet.getRange(2, 3, 14).getValues();
    
    for (var i in olVars)
    {
      if (olVars[i][0].indexOf("date") != -1)
        vals[i][0] = Utilities.formatDate(new Date(vals[i][0]), "GMT-7", "MMMM d, yyyy");
      
      olVars[i].push(vals[i][0]);
    }
    
    Logger.log(olVars);
    
    for (var i in olVars)
      olVars[i] = olVars[i].join("INNER");

    olVars = olVars.join("OUTER");

    return olVars;    
  }
}
