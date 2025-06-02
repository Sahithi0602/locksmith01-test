const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();
const ec2 = new AWS.EC2();

exports.handler = async () => {
  try {
    // Get list of all active AWS regions
    const regionsResponse = await ec2.describeRegions().promise();
    const regions = regionsResponse.Regions.map(r => r.RegionName);

    let totalKeys = 0;

    for (const region of regions) {
      const regionalKms = new AWS.KMS({ region });

      try {
        const keysData = await regionalKms.listKeys().promise();
        totalKeys += keysData.Keys.length;

        // Optionally store key details in DynamoDB
        await Promise.all(keysData.Keys.map(key =>
          ddb.put({
            TableName: process.env.KEY_TABLE,
            Item: {
              keyId: key.KeyId,
              region: region,
              timestamp: new Date().toISOString()
            }
          }).promise()
        ));
      } catch (regionErr) {
        console.warn(`Failed in region ${region}:`, regionErr.message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ count: totalKeys })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

