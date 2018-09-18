import { OAuth2Client } from "google-auth-library";
import { calendar_v3, google } from "googleapis";

const VERSION = "v3";
export class CalendarList {
    public static getAllCalendarLists(): any {
        throw new Error("Method not implemented.");
    }
    private calendar: calendar_v3.Calendar;

    constructor(auth: OAuth2Client) {
        this.calendar = google.calendar({ version: VERSION, auth });
    }

    public async getAllCalendarLists() {
        const res = await this.calendar.calendarList.list({
        });
        return res.data.items;
    }

    public async getCalenderList(calendarId: string) {
        const res = await this.calendar.calendarList.get({
            calendarId,
        });
        return res.data;
    }
}
