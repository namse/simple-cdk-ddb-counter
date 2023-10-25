#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyCdkStack } from "../lib/my-cdk-stack";

const app = new cdk.App();
new MyCdkStack(app, "MyCdkStack1", {
  // 4번이 이거
  env: {
    account: "962920162112", // AWS 들어가 오른쪽 위에 자기 이름 누르면 뜸
    region: "ap-northeast-2",
  },
});
