// ==UserScript==
// @name         Open Library Import Assist
// @namespace    https://greasyfork.org/users/559356
// @version      1
// @description  Imports book data into Open Library.
// @author       Aidan
// @match        https://openlibrary.org/books/add
// @match        https://openlibrary.org/books/*/edit
// @grant        GM.xmlHttpRequest
// ==/UserScript==

var div = "<div id='importDiv' class='input' style='padding-top:1em'></div>";
var input = "<input id='importInput' class='largest' placeholder='Enter title, ISBN, or Google Books URL' style='width:465px;padding:3px;'/>";
var button = "<button id='importButton' class='larger' title='Import data from Google Books' style='margin-left:4px'>Import</button>";
var span = "<span id='importSpan' style='margin-left:4px'></span>";

var currentUrl = window.location.href;
var mode = currentUrl.replace(/.*\//g, ""); // "add" or "edit"

if (mode == "edit") div = div.replace("padding-top:1em", "padding-top:0");

document.getElementById("contentHead").innerHTML += div;
document.getElementById("importDiv").innerHTML += input;
document.getElementById("importDiv").innerHTML += button;
document.getElementById("importDiv").innerHTML += span;
document.getElementById("importButton").addEventListener("click", importData);

var domain = "https://www.googleapis.com/books/v1/volumes";
var parameters = "?maxResults=1&q=";
var url = domain + parameters;

function importData()
{
    document.getElementById("importSpan").innerHTML = "Loading...";
    var input = document.getElementById("importInput").value.trim();

    if (!input)
    {
        alert("Error: invalid input.");
        document.getElementById("importSpan").innerHTML = "Failed!";
        return;
    }

    url += input;
    console.log(url);

    GM.xmlHttpRequest({
        method: "GET",
        url: url,
        onload: function(response)
        {
            var json = JSON.parse(response.response);
            var item = json.items[0].volumeInfo;
            var fullTitle = item.subtitle ? item.title + ": " + item.subtitle : item.title;
            var data = [];

            if (mode == "add")
            {
                data.push(["title", fullTitle]);
                data.push(["author-0", item.authors[0]]);
                data.push(["publisher", item.publisher]);
                data.push(["publish_date", item.publishedDate]);
                data.push(["id_name", item.industryIdentifiers[0].type.toLowerCase()]);
                data.push(["id_value", item.industryIdentifiers[0].identifier]);
            }
            else if (mode == "edit")
            {
                data.push(["work-title", fullTitle]);
                data.push(["author-0", item.authors[0]]);
                data.push(["edition-title", item.title]);
                data.push(["edition--subtitle", item.subtitle]);
                data.push(["edition-publishers", item.publisher]);
                data.push(["edition-publish_date", item.publishedDate]);
                data.push(["edition-description", item.description]);
                data.push(["select-id", item.industryIdentifiers[0].type.toLowerCase()]);
                data.push(["id-value", item.industryIdentifiers[0].identifier]);
                data.push(["edition--number_of_pages", item.pageCount]);
            }
            else alert("Error: the current URL does not fit the expected format.");

            for (var i in data)
            {
                if (data[i][1])
                {
                    console.log(data[i]);
                    var id = data[i][0];
                    var value = data[i][1];
                    document.getElementById(id).value = value;
                }
            }

            document.getElementById("importSpan").innerHTML = "Done!";
        }
    });
}
