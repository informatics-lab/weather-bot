# weather-bot
Met Office prototype chat bot to talk about all things weather & climate related.
Built using [Microsoft Bot Framework][1] and [LUIS][3]

## development
If you don't already have it, get the [bot emulator app][2]

### credentials
To run this app you will need a JSON credentials file with the following keys:
```javascript
{
  "PERSONA":                "default",
  "PORT":                   3978,
  "DEBUG_TOOLS":            true,
  "LOG_LEVEL":              "debug",
  "MICROSOFT_APP_ID":       "...",
  "MICROSOFT_APP_PASSWORD": "...",
  "LUIS_APP_ID":            "...",
  "LUIS_SUBSCRIPTION_KEY":  "...",
  "DATAPOINT_API_KEY":      "...",
  "GOOGLE_MAPS_API_KEY":    "..."
}
```

### installation
`npm install`   
`npm start`    

### testing
Connect your bot emulator app to your locally running instance.
URI :     `http://localhost:3978/api/messages`  
Locale :  `en-GB`  

To read/delete data collected within a chat session use: 
| Command | Result |
| --- | --- |
| `/dAllData` | Delete all data |
| `/sConversationData` | Show all `conversationData` data |
| `/dConversationData` | Delete all `conversationData` data |
| `/sUserData` | Show all `userData` data |
| `/dUserData` | Delete all `userData` data |

## notes
 * LUIS has a hard limit of 80 intents per application.

[1]: https://dev.botframework.com/
[2]: https://docs.botframework.com/en-us/tools/bot-framework-emulator/
[3]: https://www.luis.ai/home/index
