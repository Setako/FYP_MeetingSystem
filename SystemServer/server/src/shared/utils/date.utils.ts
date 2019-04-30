export class DateUtils {
    /**
     * to string in the format HHSS with or without splitMark
     * @param date
     * @param splitMark default is empty string
     */
    static toHourMinuteString(date: Date, splitMark = '') {
        return [date.getHours(), date.getMinutes()]
            .map(d => d.toString())
            .map(s => s.padStart(2, '0'))
            .reduce((acc, xs) => acc + splitMark + xs, '');
    }
}
