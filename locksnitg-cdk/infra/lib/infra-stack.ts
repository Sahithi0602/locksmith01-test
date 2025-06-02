import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function to list KMS keys
    const listKeysFn = new lambda.Function(this, 'ListKeysFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda'), // assumes your handler is in /lambda/index.js
    });

    // API Gateway to invoke Lambda
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: listKeysFn,
      proxy: true,
    });

    // Optional: DynamoDB audit log table
    new ddb.Table(this, 'AuditLog', {
      partitionKey: { name: 'id', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });
  }
}
