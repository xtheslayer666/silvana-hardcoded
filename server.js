let express = require('express'),
  bodyParser = require('body-parser'),
  port = process.env.PORT || 3000,
  app = express();
let alexaVerifier = require('alexa-verifier');
var isFirstTime = true;
const SKILL_NAME = 'Silvana Öffnungszeiten';
const GET_OH_MESSAGE = "Das Silvana ist heute ";
const HELP_MESSAGE = 'Alles gut bei Ihnen? Wie kann ich Ihnen weiterhelfen?';
const HELP_REPROMPT = 'Wie kann ich Ihnen weiterhelfen?';
const STOP_MESSAGE = 'Super! Tschüss schönen Feierabend!';
const MORE_MESSAGE = ' Haben Sie`s verstanden?'
const PAUSE = '<break time="0.3s" />'
const WHISPER = '<amazon:effect name="whispered"/>'

const data = [
  'von 9 bis 20 Uhr geöffnet.',
  'von 6 Uhr 30 bis 8 Uhr zum Frühschwimmen geöffnet.',
  'von 13 bis 20 Uhr geöffnet.',
  'von 13 bis 20 Uhr geöffnet.',
  'von 6 Uhr 30 bis 8 Uhr zum Frühschwimmen und von 13 bis 20 Uhr geöffnet.',
  'von 13 bis 20 Uhr geöffnet.',
  'von 10 bis 22 Uhr geöffnet.',
];

app.use(bodyParser.json({
  verify: function getRawBody(req, res, buf) {
    req.rawBody = buf.toString();
  }
}));

function requestVerifier(req, res, next) {
  alexaVerifier(
    req.headers.signaturecertchainurl,
    req.headers.signature,
    req.rawBody,
    function verificationCallback(err) {
      if (err) {
        res.status(401).json({
          message: 'Verification Failure',
          error: err
        });
      } else {
        next();
      }
    }
  );
}

function log() {
  if (true) {
    console.log.apply(console, arguments);
  }
}

app.post('/openingHours', requestVerifier, function(req, res) {

  if (req.body.request.type === 'LaunchRequest') {
    res.json(getOpeningHours());
    isFirstTime = false
  } else if (req.body.request.type === 'SessionEndedRequest') { /* ... */
    log("Session End")
  } else if (req.body.request.type === 'IntentRequest') {
    switch (req.body.request.intent.name) {
      case 'AMAZON.NoIntent':
        res.json(getOpeningHours());
        break;
      case 'AMAZON.YesIntent':
        res.json(stopAndExit());
        break;
      case 'AMAZON.HelpIntent':
        res.json(help());
        break;
      default:
    }
  }
});

function handleDataMissing() {
  return buildResponse(MISSING_DETAILS, true, null)
}

function stopAndExit() {

  const speechOutput = STOP_MESSAGE
  var jsonObj = buildResponse(speechOutput, true, "");
  return jsonObj;
}

function help() {

  const speechOutput = HELP_MESSAGE
  const reprompt = HELP_REPROMPT
  var jsonObj = buildResponseWithRepromt(speechOutput, false, "", reprompt);

  return jsonObj;
}

function getOpeningHours() {

  var welcomeSpeechOutput = 'Willkomen bei Silvana Öffnungszeiten<break time="0.3s" />'
  if (!isFirstTime) {
    welcomeSpeechOutput = '';
  }

  const heroArr = data;
  const heute = new Date();
  const heroIndex = heute.getDay();
  const randomHero = heroArr[heroIndex];
  const tempOutput = WHISPER + GET_OH_MESSAGE + randomHero + PAUSE;
  const speechOutput = welcomeSpeechOutput + tempOutput + MORE_MESSAGE
  const more = MORE_MESSAGE


  return buildResponseWithRepromt(speechOutput, false, randomHero, more);

}

function buildResponse(speechText, shouldEndSession, cardText) {

  const speechOutput = "<speak>" + speechText + "</speak>"
  var jsonObj = {
    "version": "1.0",
    "response": {
      "shouldEndSession": shouldEndSession,
      "outputSpeech": {
        "type": "SSML",
        "ssml": speechOutput
      },
      "card": {
        "type": "Simple",
        "title": SKILL_NAME,
        "content": cardText,
        "text": cardText
      }
    }
  }
  return jsonObj
}

function buildResponseWithRepromt(speechText, shouldEndSession, cardText, reprompt) {

  const speechOutput = "<speak>" + speechText + "</speak>"
  var jsonObj = {
     "version": "1.0",
     "response": {
      "shouldEndSession": shouldEndSession,
       "outputSpeech": {
         "type": "SSML",
         "ssml": speechOutput
       },
     "card": {
       "type": "Simple",
       "title": SKILL_NAME,
       "content": cardText,
       "text": cardText
     },
     "reprompt": {
       "outputSpeech": {
         "type": "PlainText",
         "text": reprompt,
         "ssml": reprompt
       }
     }
   }
 }
  return jsonObj
}

app.listen(port);

console.log('Alexa list RESTful API server started on: ' + port);