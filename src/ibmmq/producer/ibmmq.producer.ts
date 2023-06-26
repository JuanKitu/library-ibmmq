import { Logger } from '@nestjs/common';
import * as mq from 'ibmmq';
import { MQC } from 'ibmmq';
import { IProducer } from './producer.interface';
import { IProducerConnection } from '../interface/ibmmq.interface';
import * as console from 'console';
export class IbmmqProducer implements IProducer {
  private readonly qMgr;
  private qName;
  private topic = 'dev/';
  private readonly userId: string;
  private readonly password: string;
  private readonly connectionName: string;
  private readonly channelName: string;
  private readonly applName: string;
  private readonly logger: Logger;
  private msgId: string | null = null;
  private connectionHandle: mq.MQQueueManager;
  private queueHandle: mq.MQObject;
  private topicHandle: mq.MQObject;
  private ok = true;
  private exitCode = 0;

  constructor(config: IProducerConnection) {
    this.qMgr = config.qManager;
    this.qName = config.qName;
    this.userId = config.userId;
    this.password = config.password;
    this.connectionName = config.connectionName;
    this.channelName = config.channelName;
    this.applName = config.applName;
    this.logger = new Logger(config.channelName);
  }
  private async cleanup(hConn: mq.MQQueueManager, hObj: mq.MQObject): Promise<void> {
    try {
      await mq.ClosePromise(hObj, 0);
      this.logger.log(
        `Successfully closed to queueManager: {${this.qMgr}} | {NodeJS}-{${this.qMgr}}-{${this.qName}}-{Thread-id}`,
      );
      await mq.DiscPromise(hConn);
      this.logger.log(
        `Successfully disconnected to queueManager: {${this.qMgr}} | {NodeJS}-{${this.qMgr}}-{${this.qName}}-{Thread-id}`,
      );
    } catch (closeErr) {
      this.logger.error(
        `Failed to disconnect to queueManager: {${this.qMgr}} - Exception: {1} | {NodeJS}-{${this.qMgr}}-{${this.qName}}-{Thread-id}`,
      );
      console.log('MQ call failed in ' + closeErr);
    }
  }
  async produce(message: any): Promise<void> {
    const msg = `${message} ${new Date().toString()}`;
    const mqmd = new mq.MQMD();
    const pmo = new mq.MQPMO();
    pmo.Options = MQC.MQPMO_NO_SYNCPOINT | MQC.MQPMO_NEW_MSG_ID | MQC.MQPMO_NEW_CORREL_ID;
    return mq.PutPromise(this.queueHandle, mqmd, pmo, msg);
  }
  async connect(): Promise<void> {
    const myArgs = process.argv.slice(2); // Remove redundant parms
    if (myArgs[0]) {
      this.qName = myArgs[0];
    }
    if (myArgs[1]) {
      this.msgId = myArgs[1];
    }
    const cno = new mq.MQCNO();
    const csp = new mq.MQCSP();
    const cd = new mq.MQCD();
    csp.UserId = this.userId;
    csp.Password = this.password;
    cno.SecurityParms = csp;
    cno.ApplName = this.applName;
    cd.ConnectionName = this.connectionName;
    cd.ChannelName = this.channelName;
    cno.ClientConn = cd;
    cno.Options = MQC.MQCNO_NONE;
    try {
      const conn = await mq.ConnxPromise(this.qMgr, cno);
      const od = new mq.MQOD();
      od.ObjectName = this.qName;
      od.ObjectType = MQC.MQOT_Q;
      const openOptions = MQC.MQOO_INPUT_AS_Q_DEF + MQC.MQOO_FAIL_IF_QUIESCING + MQC.MQOO_OUTPUT;
      this.connectionHandle = conn;
      this.logger.log(
        `Successfully connected to queueManager: {${this.qMgr}} | {NodeJS}-{${this.qMgr}}-{${this.qName}}-{Thread-id}`,
      );
      const obj = await mq.OpenPromise(this.connectionHandle, od, openOptions);
      this.logger.log(
        `Successfully opened to queueManager: {${this.qMgr}} | {NodeJS}-{${this.qMgr}}-{${this.qName}}-{Thread-id}`,
      );
      this.queueHandle = obj;
    } catch (err) {
      this.ok = false;
      this.exitCode = 1;
      return;
    }
  }
  async disconnect(): Promise<void> {
    if (this.ok) {
      console.log('Disconnecting from queue manager', this.qMgr);
      await this.cleanup(this.connectionHandle, this.queueHandle);
    }
  }
}
