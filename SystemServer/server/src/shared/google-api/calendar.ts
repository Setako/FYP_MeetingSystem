import { OAuth2Client } from "google-auth-library";
import { calendar_v3, google } from "googleapis";

const VERSION = "v3";
export class Calendar {
    private calendar: calendar_v3.Calendar;

    constructor(auth: OAuth2Client) {
        this.calendar = google.calendar({ version: VERSION, auth });
    }

    public async getCalender(calendarId: string) {
        const res = await this.calendar.calendars.get({
            calendarId,
        });
        return res.data;
    }

    public async clearCalender(calendarId: string) {
        const res = await this.calendar.calendars.clear({
            calendarId,
        });
        return res.data;
    }

    public async deleteCalendar(calendarId: string) {
        const res = await this.calendar.calendars.delete({
            calendarId,
        });
        return res.data;
    }
}
