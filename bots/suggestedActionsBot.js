// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

let req = require("request");

const uri = "https://ussouthcentral.services.azureml.net/workspaces/80954885d86a43f99988a4f11e1a1766/services/1a0573275de242f68e974deee044b2f7/execute?api-version=2.0&details=true";
const apiKey = "J6Ozw8gUzPFda2BEq1YR/z/b56pNuHyF0ge5MWdJi7jdK8RCQXVggVc181PAjz5CrUVjMrn19Iyzc3JKo8ZRKQ==";

const tempUri = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en";

const delay = ms => new Promise(res => setTimeout(res, ms));

class SuggestedActionsBot extends ActivityHandler {
    constructor() {
        super();

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            const text = context.activity.text;

            // Create an array with the valid color options.
            const validMethod = ['Dine In', 'Take Away', 'Delivery'];

            const validNum = ['1', '2', '3', '4', '5']

            // If the `text` is in the Array, a valid color was selected and send agreement.
            if (validMethod.includes(text)) {
                await context.sendActivity(`Sure, let's do delivery from Store A, your approximate waiting time would be 40 minutes, sounds good?`);

                var temp = "29";

                const opt = {
                    uri: tempUri,
                    method: "GET"
                }

                req(opt, (err, res, body) => {
                    if (!err && res.statusCode == 200) {
                        var obj = JSON.parse(body);
                        temp = "" + obj.temperature.data[5].value;
                    } else {
                        console.log("The request failed with status code: " + res.statusCode);
                    }
                });

                var dine = "0", take = "0", deliv = "0";

                if (text.includes("Dine")){
                    dine = "1";
                } else if (text.includes("Take")){
                    take = "1";
                } else{
                    deliv = "1";
                }

                let data =  {
                    "Inputs": {
                        "input1":
                        {
                            "ColumnNames": ["product_desc", "qty", "is_member", "Dine In", "Take Away", "Delivery", "Region", "temp", "order_time"],
                            "Values": [ [ "value", "1", "1", dine, take, deliv, "Tai Po", temp, "" ], [ "value", "0", "0", "0", "0", "0", "value", "0", "" ], ]
                        },
                    },
                    "GlobalParameters": {}
                }

                const options = {
                    uri: uri,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apiKey,
                    },
                    body: JSON.stringify(data)
                }

                var food = "Supreme";

                req(options, (err, res, body) => {
                    if (!err && res.statusCode == 200) {
                        var obj = JSON.parse(body);
                        food = obj.Results.output1.value.Values[0][14];
                    } else {
                        console.log("The request failed with status code: " + res.statusCode);
                    }
                });

                await delay(10000);

                await this.foodSuggestion(context, food);

                await delay(10000);

                await context.sendActivity("Cool! Let me deliver that to you.")

                await delay(10000);

                await this.loving(context);

                await delay(10000);

                await this.feedback(context);

            } else if (validNum.includes(text)){
                await context.sendActivity('Thanks for the feedback. Have a nice day, Kevin :)')
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     * Send a welcome message along with suggested actions for the user to click.
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
     */
    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;

        // Iterate over all new members added to the conversation.
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = 'Hello, Kevin. Time to eat!';
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    /**
     * Send suggested actions to the user.
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
     */
    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['Dine In', 'Take Away', 'Delivery'], 'How would you like to eat?');
        await turnContext.sendActivity(reply);
    }

    async foodSuggestion(turnContext, food) {
        var reply = `${ food } seems nice, wanna try that?`;
        await turnContext.sendActivity(reply);
    }

    async loving(turnContext) {
        var reply = 'Enjoying your food, Kevin? Care to give us some feedbacks on this recommendation?';
        await turnContext.sendActivity(reply);
    }

    async feedback(turnContext) {
        var reply = MessageFactory.suggestedActions(['1', '2', '3', '4', '5'], '[Feedback] On a scale of 1 to 5, how would you rate this recommendation? (1: needs improvements, 5: suits me really well)');
        await turnContext.sendActivity(reply);
    }
}

module.exports.SuggestedActionsBot = SuggestedActionsBot;