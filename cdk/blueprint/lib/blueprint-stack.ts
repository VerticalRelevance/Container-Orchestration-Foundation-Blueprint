import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class BlueprintStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'BlueprintQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
