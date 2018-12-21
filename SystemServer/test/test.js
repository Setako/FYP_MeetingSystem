const authTest = require("./src/auth");
const meetingTest = require("./src/meeting");
const environment = {
    api: 'https://conference-commander.herokuapp.com/api',
    token: null
};

function test() {
    const username = "tester" + Math.round(Math.random() * 10000);

    authTest(environment, username, "correctpassword");

    meetingTest(environment);
}

test();