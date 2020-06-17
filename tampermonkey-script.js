// ==UserScript==
// @name         Open Library Import Assist
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Open Library editing script.
// @author       Aidan
// @include      https://www.amazon*dp*
// @include      https://www.amazon*gp*
// @match        *://*.openlibrary.org/*/add
// @match        *://*.openlibrary.org/*/edit
// @grant        GM.xmlHttpRequest
// ==/UserScript==

var button, urlResponse;
var div = "<div id='userDiv' style='padding:1em 0'></div>";
var span = "<span id='userSpan' style='margin-left:4px'></span>";
var appUrl = "https://script.google.com/macros/s/AKfycbz-KGqoUOPojLDELm2LmZ0H3bJZaCe09rto2skl1A/exec";
var currentUrl = window.location.href;

if (currentUrl.indexOf("amazon") != -1)
{
    button = "<button id='userBtn' title='Export data to Open Library'>Export data</button>";
    document.getElementById("titleblock_feature_div").innerHTML += div;
    document.getElementById("userDiv").innerHTML += button;
    document.getElementById("userDiv").innerHTML += span;
    document.getElementById("userBtn").addEventListener("click", exportContent);
}
else if (currentUrl.indexOf("openlibrary") != -1)
{
    button = "<button id='userBtn' title='Import data from Amazon'>Import data</button>";
    document.getElementById("contentHead").innerHTML += div;
    document.getElementById("userDiv").innerHTML += button;
    document.getElementById("userDiv").innerHTML += span;
    document.getElementById("userBtn").addEventListener("click", importContent);
}

function exportContent()
{
    document.getElementById("userSpan").innerHTML = "Loading...";
    var content, col, author, publishDate, format;
    var title = document.getElementById("productTitle").innerHTML.replace(/\n| \(.*/g, "");

    try
    {
        author = document.getElementById("bylineInfo").getElementsByClassName("a-link-normal")[0].innerHTML.replace(/Visit Amazon's | Page/g, "");
    }
    catch(e) {}

    if (currentUrl.indexOf("amazon.com") != -1) content = document.getElementById("detail-bullets").getElementsByClassName("content")[0].innerHTML;
    else if (currentUrl.indexOf("amazon.co.jp") != -1) content = document.getElementById("detail_bullets_id").getElementsByClassName("content")[0].innerHTML;

    content = content.replace(/\n|<b>|<\/b>|<\/li>|<br>/g, "");
    content = content.split("<li>");
    content.shift(); // Removes empty value
    content.pop(); // Removes customer reviews

    for (var i = 0; i < content.length; i++)
    {
        content[i] = content[i].split(":");
        content[i][0] = content[i][0].trim();

        if (content[i][0] == "Publisher")
        {
            if (content[i][1].indexOf("(") != -1) publishDate = content[i][1].replace(/.*\(|\).*/g, "");
        }
        else if (content[i][0].indexOf("Dimensions") != -1)
        {
            var dimensions = content[i][1].split(" x ");
            for (var j in dimensions) dimensions[j] = dimensions[j].replace("inches", "").trim();
            dimensions.sort();
        }
        else if (content[i].length != 2 || content[i][1].indexOf("pages") != -1)
        {
            format = content[i][0];
            content[i][0] = "Pages";
            if (content[i].length != 2) content[i].push("");
        }

        if (content[i].length == 2) content[i][1] = content[i][1].trim().replace(/ pages| \(.*/g, "");
    }

    if (dimensions)
    {
        content.push(["Height", dimensions[2]]);
        content.push(["Width", dimensions[1]]);
        content.push(["Depth", dimensions[0]]);
    }

    content.push(["Title", title]);
    content.push(["Author", author]);
    content.push(["Publish Date", publishDate]);
    content.push(["Format", format]);
    console.log(content);

    for (var l in content) content[l] = content[l].join("INNER");

    content = content.join("OUTER");

    appUrl += "?content=" + content;
    urlResponse = getUrlResponse(appUrl);
}

function importContent()
{
    document.getElementById("userSpan").innerHTML = "Loading...";
    if (appUrl.indexOf("?content=") == -1)
    {
        if (currentUrl.indexOf("add") != -1) appUrl += "?content=add";
        else if (currentUrl.indexOf("edit") != -1) appUrl += "?content=edit";
    }
    urlResponse = getUrlResponse(appUrl);
}

function getUrlResponse(url)
{
    GM.xmlHttpRequest({
        method: "GET",
        url: url,
        onload: function(response)
        {
            var urlResponse = response.responseText;

            if (currentUrl.indexOf("openlibrary") != -1)
            {
                urlResponse = urlResponse.split("OUTER");
                for (var m in urlResponse)
                {
                    urlResponse[m] = urlResponse[m].split("INNER");

                    if (urlResponse[m][0].indexOf("weight") != -1 && urlResponse[m][1] != "")
                    {
                        urlResponse[m][1] = urlResponse[m][1].split(" ");
                        var radioId = "edition--weight--units--" + urlResponse[m][1][1];
                        document.getElementById(radioId).checked = true;;
                        urlResponse[m][1].pop();
                    }

                    if (urlResponse[m][0].indexOf(",") != -1)
                    {
                        urlResponse[m][0] = urlResponse[m][0].split(",");
                        for (var n in urlResponse[m][0]) document.getElementById(urlResponse[m][0][n]).value = urlResponse[m][1];
                    }
                    else if (urlResponse[m][1] != "") document.getElementById(urlResponse[m][0]).value = urlResponse[m][1];
                }
            }
            document.getElementById("userSpan").innerHTML = "Done!";
        }
    });
}
