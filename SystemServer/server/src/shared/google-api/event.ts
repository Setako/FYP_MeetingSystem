import { OAuth2Client } from "google-auth-library";
import { calendar_v3, google } from "googleapis";

const VERSION = "v3";
export class Event {
    private calendar: calendar_v3.Calendar;

    constructor(auth: OAuth2Client) {
        this.calendar = google.calendar({ version: VERSION, auth });
    }
    public async getAllEvents(calendarid: string) {

        const res = await this.calendar.events.list({
            calendarId: calendarid,
        });
        return res.data.items;
    }

    public async getEvent(calendarId: string, eventId: string) {
        const res = await this.calendar.events.get({
            calendarId,
            eventId,
        });
        return res.data;
    }

    public async deleteEvent(calendarId: string, eventId: string) {
        const res = await this.calendar.events.delete({
            calendarId,
            eventId,
        });
        return res.data;
    }

    public async addEvent(calendarId: string, startTime: Date, endTime: Date, summary: string) {
        const res = await this.calendar.events.insert({
            calendarId,
            requestBody: {
                start: {
                    date: `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()}`,
                },
                end: {
                    date: `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()}`,
                },
                summary,
            },
        });
        return res.data;
    }

    public async updateEvents(calendarId: string, eventId: string, startTime: Date, endTime: Date) {
        const res = await this.calendar.events.update({
            calendarId,
            eventId,
            requestBody: {
                start: {
                    date: `${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()}`,
                },
                end: {
                    date: `${endTime.getFullYear()}-${endTime.getMonth()}-${endTime.getDate()}`,
                },
            },
        });
        return res.data;
    }

    public async instancesEvents(calendarId: string, eventId: string) {
        const res = await this.calendar.events.instances({
            calendarId,
            eventId,
        });
        return res.data;
    }

    public async moveEvent(calendarId: string, eventId: string, targetCalendar: string) {
        const res = await this.calendar.events.move({
            calendarId,
            eventId,
            destination: targetCalendar,
        });
        return res.data;
    }
}
