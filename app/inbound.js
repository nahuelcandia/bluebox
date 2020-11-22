'use strict';

module.exports.proxy = async event => {
  /*
    1. Replace sensitive data for an alias.
    1.1 Get from DB sensitive data to replace (attribute name) and REGEX of what should be replaced
    replacements: [{
      rule_id
      attributeName: ex. 'card_number' is the attribute to be searched for.
      present_in: ['body', 'headers', 'querystring'] - where should we look to replace this attribute?
      regex: if null, everything will be replaced, otherwise a rule will be applied
      delete_after: [time in seconds] - if null is never deleted, otherwise it will be deleted after the indicated time
      updatedAt
      createdAt
    }]
    data: [
      {
        rule_id: the id of the rule applied, in order to 
        raw: { ..yourstuff },
        alias: random and unique generated alias.
        expiration:
        updatedAt
        createdAt
      }
    ]
    2. Save the data in DynamoDB.
    3. Forward the request to the endpoint and await response.
    4. Forward the response back to the customer.
  */
 
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };
  
};
