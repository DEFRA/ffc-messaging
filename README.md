# ffc-messaging

Messaging npm module for FFC services

## Usage

### Installation

```
npm install --save ffc-messaging
```

### Configuration

`host` - Azure Service Bus namespace, for example, `myservicebus.servicebus.windows.net`

`usePodIdentity` - Boolean value for whether to authenticate connection with [AAD Pod Identity](https://github.com/Azure/aad-pod-identity).  If `false`, then `username` and `password` are required.

`username` - Azure Service Bus Shared Access Key name for authentication.  Not required if `usePodIdentity` is `true`.

`password` - Azure Service Bus Shared Access Key value for authentication.  Not required if `usePodIdentity` is `true`.

`type` - Azure Service Bus entity to connect to, allows `queue`, `topic` or `subscription`.

`address` - Name of the Azure Service Bus queue, topic or subscription to connect to.

`topic` - Required for subscription connections only.  The name of the topic the subscription belongs to.

`appInsights` - Application Insights module if logging is required

#### Example

```
const config = {
  host: 'myservicebus.servicebus.windows.net',
  usePodIdentity: false,
  username: 'mySharedAccessKeyName',
  password: 'mySharedAccessKey,
  address: 'mySubscription,
  type: 'subscription',
  topic: 'myTopic',
  appInsights: require('applicationinsights')
}
```

### Sending a message

Message objects must follow the below structure.

`body` - The body of the message.

`type` - Type of message using reverse DNS notation. For example, `uk.gov.demo.claim.validated`.

`subject` - Optional, if the body alone is not sufficient to give context to the recipient.  For example, `myImage.jpeg`.

`sender` - Name of the service sending the message.  For example, `ffc-demo-claim-service`

`correlationId` - Optional, if distributed tracing through Application Insights is required.


#### Example

```
const message = {
  body: { claimId: 1 },
  type: 'uk.gov.demo.claim.validated',
  subject: 'New Claim',
  sender: 'ffc-demo-claim-service'
}
```
```
const sender = new MessageSender(config)
await sender.connect()
await sender.sendMessage(message)

// shutdown when needed
await sender.closeConnection()
```

### Receiving a message

```
const action = function (message) {
  console.log(message.body)
}

const receiver = new MessageReceiver(config, action)
await receiver.connect()

// shutdown when needed
await receiver.closeConnection()
```

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT
LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and
applications when using this information.

> Contains public sector information licensed under the Open Government license
> v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her
Majesty's Stationery Office (HMSO) to enable information providers in the
public sector to license the use and re-use of their information under a common
open licence.

It is designed to encourage use and re-use of information freely and flexibly,
with only a few conditions.
