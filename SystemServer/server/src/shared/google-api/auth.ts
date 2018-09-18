import fs from "fs";
import { google } from "googleapis";
import readline from "readline";
import { promisify } from "util";

const SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/calendar",
];
const TOKEN_PATH = "json/token.json";
const CREDENTIALS_PATH = "json/credentials.json";

/**
 * Ask the question and wait for the answer
 * @param {string} query question that will be asked
 */
export function question(query: any) {
    return new Promise((res) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(query, (input: any) => {
            rl.close();
            res(input);
        });
    });
}

export async function loadCredentails() {
    try {
        const content: any = await promisify(fs.readFile)(CREDENTIALS_PATH);
        return JSON.parse(content);
    } catch (err) {
        throw err;
    }
}

/**
 * Create an OAuth2 client with the given credentials
 * @param {Object} credentials The authorization client credentials
 */
export async function authorize(credentials: any) {
    const {
        client_secret,
        client_id,
        redirect_uris,
    } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    try {
        const token: any = await promisify(fs.readFile)(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));

        return oAuth2Client;
    } catch (err) {
        return await getAccessToken(oAuth2Client);
    }
}

/**
 * Get and store new token after prompting for user authorization
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for
 */
export async function getAccessToken(oAuth2Client: any) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url:", authUrl);

    const code = await question("Enter the code from that page here: ");

    const token = await new Promise((res, rej) => {
        oAuth2Client.getToken(code, (err: any, receivedToken: any) => {
            if (err) { rej("Error retrieving access token"); }
            res(receivedToken);
        });
    });

    oAuth2Client.setCredentials(token);
    await promisify(fs.writeFile)(TOKEN_PATH, JSON.stringify(token));
    console.log("Token stored to", TOKEN_PATH);

    return oAuth2Client;
}
