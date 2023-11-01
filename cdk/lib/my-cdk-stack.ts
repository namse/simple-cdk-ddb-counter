import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class MyCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const branchName = process.env.BRANCH_NAME;
    if (!branchName) {
      throw new Error("BRANCH_NAME is not defined");
    }

    const ddb = new cdk.aws_dynamodb.Table(this, "Table", {
      partitionKey: { name: "pk", type: cdk.aws_dynamodb.AttributeType.STRING },
      deletionProtection: branchName === "main",
      removalPolicy:
        branchName === "main"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
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

    const usEast1Certificate =
      cdk.aws_certificatemanager.Certificate.fromCertificateArn(
        this,
        "UsEast1Certificate",
        "arn:aws:acm:us-east-1:962920162112:certificate/f4f41e6d-17b4-4574-b820-3399b1a7c251"
      );

    const domainName = `${branchName
      .replaceAll("/", "-")
      .replaceAll(".", "-")}.namseent.com`;

    const cloudfrontDistribution = new cdk.aws_cloudfront.Distribution(
      this,
      "CloudfrontDistribution",
      {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.HttpOrigin(
            cdk.Fn.select(2, cdk.Fn.split("/", functionUrl.url))
          ),
          viewerProtocolPolicy:
            cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cdk.aws_cloudfront.OriginRequestPolicy
              .ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        domainNames: [domainName],
        certificate: usEast1Certificate,
      }
    );

    new cdk.aws_route53.ARecord(this, "ARecord", {
      zone: cdk.aws_route53.HostedZone.fromHostedZoneAttributes(
        this,
        "HostedZone",
        {
          hostedZoneId: "Z073117718MVEORL15TYP",
          zoneName: "namseent.com",
        }
      ),
      recordName: domainName,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.CloudFrontTarget(cloudfrontDistribution)
      ),
    });
  }
}
