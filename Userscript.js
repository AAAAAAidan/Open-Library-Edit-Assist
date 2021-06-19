// ==UserScript==
// @name         Open Library Edit Assist
// @namespace    https://greasyfork.org/users/559356
// @version      1
// @description  Imports book data into Open Library.
// @author       Aidan
// @match        https://openlibrary.org/books/add
// @match        https://openlibrary.org/books/*/edit
// @grant        GM.xmlHttpRequest
// ==/UserScript==

var div = "<div id='importDiv' class='input' style='padding-top:1em'></div>";
var input = "<input id='importInput' class='largest' placeholder='Enter title or ISBN' style='width:465px;padding:3px;'/>";
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

function importData()
{
    document.getElementById("importSpan").innerHTML = "Loading...";
    console.log("Loading...");
    var input = document.getElementById("importInput").value.trim();
    var error;

    if (!input)
    {
        error = "Error: invalid input"
        document.getElementById("importSpan").innerHTML = error;
        console.log(error);
        return;
    }

    var domain = "https://www.googleapis.com/books/v1/volumes";
    var parameters = "?maxResults=1&q=";
    var url = domain + parameters + input;
    console.log(url);

    GM.xmlHttpRequest({
        method: "GET",
        url: url,
        onload: function(response)
        {
            var json = JSON.parse(response.response);
            var item = json.items ? json.items[0].volumeInfo : null;

            if (!item)
            {
                error = "Error: no results found";
                document.getElementById("importSpan").innerHTML = error;
                console.log(error);
                return;
            }

            var fullTitle = item.subtitle ? item.title + ": " + item.subtitle : item.title;
            var data = [];

            // Get the data from the JSON in the format [ ... [id, value] ...]
            if (mode == "add")
            {
                data.push(["title", fullTitle]);
                data.push(["author-0", item.authors ? item.authors[0] : null]);
                data.push(["publisher", item.publisher ? item.publisher : null]);
                data.push(["publish_date", item.publishedDate ? item.publishedDate : null]);
                data.push(["id_name", item.industryIdentifiers ? item.industryIdentifiers[0].type.toLowerCase() : null]);
                data.push(["id_value", item.industryIdentifiers ? item.industryIdentifiers[0].identifier : null]);
            }
            else if (mode == "edit")
            {
                data.push(["work-title", fullTitle]);
                data.push(["author-0", item.authors ? item.authors[0] : null]);
                data.push(["edition-title", item.title ? item.title : null]);
                data.push(["edition-subtitle", item.subtitle ? item.subtitle : null]);
                data.push(["edition-publishers", item.publisher ? item.publisher : null]);
                data.push(["edition-publish_date", item.publishedDate ? item.publishedDate : null]);
                data.push(["edition-description", item.description ? item.description : null]);
                data.push(["select-id", item.industryIdentifiers ? item.industryIdentifiers[0].type.toLowerCase() : null]);
                data.push(["id-value", item.industryIdentifiers ? item.industryIdentifiers[0].identifier : null]);
                data.push(["edition--number_of_pages", item.pageCount ? item.pageCount : null]);
            }
            else
            {
                error = "Error: the current URL does not fit the expected format";
                document.getElementById("importSpan").innerHTML = error;
                console.log(error);
                return;
            }

            // Put the data into the edit form
            for (var i in data)
            {
                if (!data[i][1]) continue;
                var id = data[i][0];
                var newValue = data[i][1];
                var oldValue = document.getElementById(id).value;

                // If a different value that is not an ISBN id already exists in the field
                if (oldValue && oldValue != newValue && id.indexOf("id") == -1)
                {
                    var answer = window.confirm(`Change "${oldValue}" to "${newValue}"?`);
                    if (answer) document.getElementById(id).value = newValue;
                }
                else document.getElementById(id).value = newValue;
            }

            document.getElementById("importSpan").innerHTML = "Done!";
            console.log("Done!");
        }
    });
}
