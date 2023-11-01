import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class MyCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "Bucket", {
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
    });

    const ddb = new cdk.aws_dynamodb.Table(this, "Table", {
      partitionKey: { name: "pk", type: cdk.aws_dynamodb.AttributeType.STRING },
    });

    const myLambda = new lambda.Function(this, "Lambda", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../src")),
      environment: {
        DdbTableName: ddb.tableName,
      },
      initialPolicy: [
        new cdk.aws_iam.PolicyStatement({
          actions: ["dynamodb:*"],
          resources: [ddb.tableArn],
        }),
      ],
    });

    const functionUrl = new lambda.FunctionUrl(this, "FunctionUrl", {
      function: myLambda,
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: functionUrl.url });
  }
}
