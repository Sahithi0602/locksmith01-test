import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ✅ Import existing DynamoDB table by name
    const keyTable = ddb.Table.fromTableName(this, 'KeyInventory', 'QuantumFortisInventoryStack-KeyInventoryB5DA9D65-1LXJKL5X8HKBG');

    // ✅ Lambda to scan KMS keys and write to DynamoDB
    const listKeysFn = new lambda.Function(this, 'ListKeysFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      timeout: cdk.Duration.seconds(30),
      environment: {
        KEY_TABLE: 'QuantumFortisInventoryStack-KeyInventoryB5DA9D65-1LXJKL5X8HKBG',
      },
    });

    // Allow writing to DynamoDB
    keyTable.grantWriteData(listKeysFn);

    // IAM policy for EC2 and KMS access
    listKeysFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DescribeRegions', 'kms:ListKeys'],
        resources: ['*'],
      })
    );

    // ✅ Lambda to return all items from DynamoDB
    const getInventoryFn = new lambda.Function(this, 'GetInventoryFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'get-inventory.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      timeout: cdk.Duration.seconds(15),
      environment: {
        KEY_TABLE: 'QuantumFortisInventoryStack-KeyInventoryB5DA9D65-1LXJKL5X8HKBG',
      },
    });

    // Allow reading from DynamoDB
    keyTable.grantReadData(getInventoryFn);

    // ✅ REST API Gateway
    const api = new apigw.RestApi(this, 'Endpoint', {
      restApiName: 'QuantumFortisAPI',
      deployOptions: {
        stageName: 'prod',
      },
    });

    // / → ListKeysFunction
    api.root.addMethod('GET', new apigw.LambdaIntegration(listKeysFn));

    // /inventory → GetInventoryFunction
    const inventoryResource = api.root.addResource('inventory');
    inventoryResource.addMethod('GET', new apigw.LambdaIntegration(getInventoryFn));

    // Optional: AuditLog table for future use
    new ddb.Table(this, 'AuditLog', {
      partitionKey: { name: 'id', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });
  }
}

