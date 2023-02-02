import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from "aws-cdk-lib/aws-iam";
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as team from '../lib/teams';
import * as infrastructure from '../lib/infrastrucuture';


const app = new cdk.App();
const account = '899456967600';
const region = 'us-east-2';


const platformTeam = new team.TeamPlatform(account)


const teams: Array<blueprints.Team> = [
            platformTeam
        ];

const cloudWatchLogPolicy = new iam.PolicyStatement({
    actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
    ],
    resources: ["*"],
})

const domainName = "verticalrelevancelabs.com";

const addOns: Array<blueprints.ClusterAddOn> = [
    new blueprints.addons.ArgoCDAddOn(),
    new blueprints.addons.MetricsServerAddOn,
    //new blueprints.addons.ClusterAutoScalerAddOn,
    new blueprints.addons.AwsLoadBalancerControllerAddOn(),
    new blueprints.addons.ExternalDnsAddOn({
        hostedZoneResources: ["HostedZone"]
    }),
    new blueprints.addons.VpcCniAddOn(),
    new blueprints.addons.KarpenterAddOn( {
        subnetTags: {
            "Name": "blueprint/blueprint-vpc/PrivateSubnet1",
        },
        securityGroupTags: {
            "kubernetes.io/cluster/blueprint": "owned",
        }
    }
    ),
    new blueprints.addons.CertManagerAddOn(),
    new blueprints.addons.AwsForFluentBitAddOn({ 
        version: '0.1.22',
        iamPolicies: [cloudWatchLogPolicy],
        values: {
            cloudWatch: {
                enabled: true,
                region: region,
            },
            firehose: {
                enabled: false,
            },
            kinesis: {
                enabled: false,
            },
            elasticSearch: {
                enabled: false,
            }
        }
    }),
];

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .resourceProvider("HostedZone", new blueprints.LookupHostedZoneProvider(domainName))
    .addOns(...addOns)
    .teams(...teams)
    .build(app, 'blueprint');

const vpc = stack.getClusterInfo().cluster.vpc;

const clusterSecurityGroup = stack.getClusterInfo().cluster.clusterSecurityGroup;

const securityStack = new infrastructure.SecurityStack(app, 'SecurityStack', { 
    vpc: vpc, 
    clusterSecurityGroup: clusterSecurityGroup, 
    env: { account: account, region: region } 
});

const backend = new infrastructure.AppBackendInfrastructureStack(app, 'RedisStack', { 
    vpc: vpc, 
    redisSecurityGroup: securityStack.redisSecurityGroup, 
    rdsSecurityGroup: securityStack.rdsSecurityGroup, 
    env: { account: account, region: region } 
});

const pipeline = new infrastructure.PipelineStack(app, 'PipelineStack',  {redisHostname: backend.redisHostname, redisPort: backend.redisPort, rdsCluster: backend.rdsCluster, rdsSecretName: backend.rdsSecretName, pipelineName: 'springboot-multiarch', env: { account: account, region: region } });
const springBackendPipeline = new infrastructure.PipelineStack(app, 'SpringBackendPipelineStack',  {redisHostname: backend.redisHostname, redisPort: backend.redisPort, rdsCluster: backend.rdsCluster, rdsSecretName: backend.rdsSecretName, pipelineName: 'spring-backend', env: { account: account, region: region } });
const springFrontendPipeline = new infrastructure.PipelineStack(app, 'SpringFrontendPipelineStack',  {redisHostname: backend.redisHostname, redisPort: backend.redisPort, rdsCluster: backend.rdsCluster, rdsSecretName: backend.rdsSecretName, pipelineName: 'spring-frontend', env: { account: account, region: region } });
