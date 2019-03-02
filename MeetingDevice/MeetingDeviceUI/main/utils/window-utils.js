let exec = require('child_process').exec;
let promiseExec = require('./exec-utils').promiseExec;

/**
 * @param {?string} windowId
 * @param {?Array.<string>} options
 * @return {Promise<T | never>}
 */
function getWindowInformation(windowId, options) {
    windowId = windowId || '$(xdotool getactivewindow)';
    let optionStr = options == null ? '' : options.join(' ');
    return promiseExec(`xwininfo -id ${windowId} ${optionStr}`).then(res => {
        /** @type Array.<String> */
        let outArr = res.out.split(/\r?\n/);
        let result = {};
        outArr
            .map(line => line.trim())
            .forEach(line => {
                if (line.startsWith('xwininfo:')) {
                    let data = line.split(':', 3)[2];
                    let firstSpace = data.trim().indexOf(' ');

                    let dataArr = data.trim().split(' ', 2);
                    result['Window id'] = data
                        .substring(0, firstSpace + 1)
                        .trim();
                    result['Window title'] = data
                        .substring(firstSpace + 1, data.length)
                        .trim();
                } else if (line.startsWith('-geometry')) {
                    result['Geometry'] = line.split(' ', 2)[1];
                } else if (line.indexOf(':') >= 0) {
                    let key = line.split(':', 2)[0].trim();
                    let value = line.split(':', 2)[1].trim();
                    result[key] = value;
                }
            });
        return result;
    });
}

module.exports = {
    getWindowInformation: getWindowInformation,
};
