const xapi = require('xapi');
const msg = {
    Title: 'End Presentation',
    Text: 'Presentation will be stopped due to inactivity.',
    FeedbackId: 'auto-stop-content',
    'Option.1': 'Cancel'
};

const EMPTY_ROOM_TIME = 3 * 60 * 1000;  // 3 minutes
const PROMPT_TIME = 60 * 1000;          // 1 minute

var peoplePresence = false;
var sendingContent = false;
var timer1 = undefined;
var timer2 = undefined;

var checkPeople = function(p) {
    if (p !== undefined) {
        if (p === 'Yes') {
            peoplePresence = true;
            clearTimeout(timer1);
        }
        else {
            peoplePresence = false;
        }
        
        console.log('peoplePresence', peoplePresence);
        
        if (sendingContent && !peoplePresence) {
            timer1 = setTimeout(function() {
                console.log('Showing pop-up msg', msg.FeedbackId);
                xapi.command('UserInterface Message Prompt Display', msg);
                timer2 = setTimeout(function() {
                    console.log('Stopping content');
                    xapi.command('UserInterface Message Prompt Clear', { FeedbackId: msg.FeedbackId });
                    xapi.command('Presentation Stop');
                }, PROMPT_TIME);
            }, EMPTY_ROOM_TIME);
        }
    }
};

var cancelAutoStop = function(event) {
    if (event.FeedbackId == msg.FeedbackId) {
        if (event.OptionId == '1') {
            clearTimeout(timer2);
            console.log('Canceling pop-up msg', msg.FeedbackId);
        }
    }
}

var checkContent = function(p) {
    if (p.LocalInstance !== undefined) {
        if (p.LocalInstance[0].SendingMode === 'LocalOnly') {
            sendingContent = true;
        }
        else {
            sendingContent = false;
            clearTimeout(timer1);
        }
        
        console.log('sendingContent', sendingContent);
    }
};

xapi.config.set('RoomAnalytics PeoplePresenceDetector', 'On');
xapi.status.on('RoomAnalytics PeoplePresence', checkPeople);
xapi.status.get('RoomAnalytics PeoplePresence').then(checkPeople);

xapi.status.on('Conference Presentation', checkContent);
xapi.status.get('Conference Presentation').then(checkContent);

xapi.event.on('UserInterface Message Prompt Response', cancelAutoStop);
