import * as QRCode from 'qrcode';
import { from, Observable } from 'rxjs';
export class QRCodeUtil {
    public static toDataUrl(input: string): Observable<string> {
        return from(QRCode.toDataURL(input));
    }
}
