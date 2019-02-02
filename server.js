// Import our requiremnets
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// Points to the wr sheet
const sheet_id = '12aM4AqNZWHtgcvUNvLXaO8OhmDzRrDJYfHkgzg8fph4'

var holders = {},
    done = false

// For parsing the data
var chunk = (array, elementPerChunk) => {
  let out = []
  for (let i = 0; i < array.length; i += elementPerChunk) {
    let temp = []
    for (let j = 0; j < elementPerChunk; j++) {
      temp.push(array[i + j])
    }
    out.push(temp)
  }
  return out
}

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.

function run() {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), getData);
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// Does all the fancy stuff
function getData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: sheet_id,
    "range": "Discord IDs!A1:C",
    "majorDimension": "ROWS"
  }, (err, res) => {
    // Here we have the data from the "Discord IDs" sheet
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      let i = 1
      rows.map((row) => {
        if (row.length == 2) { // Makes sure "Not in server" and "deleted account" dont get parsed in
          holders[row[0]] = {id: row[1], count: 0, score: 0}
        }
      });
      sheets.spreadsheets.values.get({
        spreadsheetId: sheet_id,
        "range": "Records!C14:AF",
        "majorDimension": "ROWS"
      }, (err, res) => {
        // Now we have the data from the records sheet
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
          let i = 1
          rows.map((row) => {
            let parts = chunk(row, 3) // puts every 3 items in an array
            parts.map((r_chunk) => {
              if (holders[r_chunk[1]]) { // Check if the name exists in our list of holders
                holders[r_chunk[1]].count += 1 //  If so, increase the wr count by one and...
                let num = parseFloat(r_chunk[0]),
                    ismil = r_chunk[0].includes('mil') // These get a number and a boolean saying if its a million or thousand
                if (ismil) {
                  holders[r_chunk[1]].score += (num * 1000000) // if its a millions score, add the number times a million to the total score
                } else {
                  holders[r_chunk[1]].score += (num * 1000) // if its thousands, add the number times a thousand
                }
              }
            })
            done = true // Tell the rest of the code everything is done
          });
        } else {
          console.log('No data found.');
        }
      })
    } else {
      console.log('No data found.');
    }
  })
}

run() // Run the functions


// This code checkes every 50ms if the rest if done processing
function check() {
  if (done) {
    /* 
    
      Place your code here!
      
    */
    console.log(holders)
  } else {
    setTimeout(check, 50)
  }
}
setTimeout(check, 50)